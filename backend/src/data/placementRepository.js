const fs = require("fs");
const path = require("path");

const storePath = path.join(__dirname, "placementSubmissionsStore.json");
const DEFAULT_COOLDOWN_HOURS = 24;

function ensureStoreFile() {
  if (!fs.existsSync(storePath)) {
    fs.writeFileSync(storePath, "[]\n");
  }
}

function readStore() {
  ensureStoreFile();
  const raw = fs.readFileSync(storePath, "utf8").trim();

  if (!raw) {
    return [];
  }

  const parsed = JSON.parse(raw);
  return Array.isArray(parsed) ? parsed : parsed.submissions || [];
}

function writeStore(submissions) {
  ensureStoreFile();
  fs.writeFileSync(storePath, `${JSON.stringify(submissions, null, 2)}\n`);
}

function sortNewestFirst(submissions) {
  return [...submissions].sort((left, right) => {
    return (
      new Date(right.submittedAt).getTime() - new Date(left.submittedAt).getTime()
    );
  });
}

function listSubmissions() {
  return sortNewestFirst(readStore());
}

function listSubmissionsForTarget(targetId) {
  return sortNewestFirst(readStore().filter((entry) => entry.targetId === targetId));
}

function getSubmissionById(id) {
  return readStore().find((entry) => entry.id === id) || null;
}

function createSubmission(submission) {
  const submissions = readStore();
  submissions.push(submission);
  writeStore(submissions);
  return submission;
}

function buildTargetSummary(submissions) {
  if (!submissions.length) {
    return {
      placementStatus: "not_started",
      latestSubmissionAt: null,
      latestVerificationScore: null,
      latestSubmissionId: null,
      latestReviewReason: null,
      verifiedCount: 0,
    };
  }

  const ordered = sortNewestFirst(submissions);
  const latest = ordered[0];
  const verifiedCount = ordered.filter((entry) => entry.status === "verified").length;

  return {
    placementStatus: latest.status || "not_started",
    latestSubmissionAt: latest.submittedAt || null,
    latestVerificationScore:
      typeof latest.verificationScore === "number"
        ? latest.verificationScore
        : null,
    latestSubmissionId: latest.id || null,
    latestReviewReason: latest.reviewReason || null,
    verifiedCount,
  };
}

function getTargetSummary(targetId) {
  return buildTargetSummary(listSubmissionsForTarget(targetId));
}

function getSummariesByTargetIds(targetIds) {
  const targetIdSet = new Set(targetIds);
  const grouped = new Map(targetIds.map((targetId) => [targetId, []]));

  for (const submission of readStore()) {
    if (!targetIdSet.has(submission.targetId)) continue;
    grouped.get(submission.targetId).push(submission);
  }

  const summaries = new Map();
  for (const targetId of targetIds) {
    summaries.set(targetId, buildTargetSummary(grouped.get(targetId) || []));
  }

  return summaries;
}

function attachSummariesToHotspots(hotspots) {
  const targetIds = hotspots.map((hotspot) => `hotspot:${hotspot.id}`);
  const summaries = getSummariesByTargetIds(targetIds);

  return hotspots.map((hotspot) => {
    const targetId = `hotspot:${hotspot.id}`;
    return {
      ...hotspot,
      placementTargetId: targetId,
      ...summaries.get(targetId),
    };
  });
}

function findDuplicateForTarget(
  targetId,
  imageHash,
  { cooldownHours = DEFAULT_COOLDOWN_HOURS } = {},
) {
  const matches = listSubmissionsForTarget(targetId).filter(
    (entry) => entry.imageHash === imageHash,
  );

  if (!matches.length) {
    return {
      exactDuplicate: false,
      exactVerified: false,
      withinCooldown: false,
      latestSubmission: null,
    };
  }

  const cooldownMs = cooldownHours * 60 * 60 * 1000;
  const now = Date.now();
  const exactVerified = matches.some((entry) => entry.status === "verified");
  const withinCooldown = matches.some((entry) => {
    const submittedAt = new Date(entry.submittedAt).getTime();
    return Number.isFinite(submittedAt) && now - submittedAt <= cooldownMs;
  });

  return {
    exactDuplicate: true,
    exactVerified,
    withinCooldown,
    latestSubmission: matches[0],
  };
}

module.exports = {
  createSubmission,
  listSubmissions,
  listSubmissionsForTarget,
  getSubmissionById,
  getTargetSummary,
  getSummariesByTargetIds,
  attachSummariesToHotspots,
  findDuplicateForTarget,
};
