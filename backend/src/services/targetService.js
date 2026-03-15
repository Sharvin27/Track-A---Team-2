const fallbackTargets = require("../data/placementTargets");
const { getTargetSummary } = require("../data/placementRepository");
const {
  getStoredHotspotsWithPlacementSummary,
  getHotspotByIdWithPlacementSummary,
} = require("./osmHotspotService");

async function listTargets() {
  const hotspots = await getStoredHotspotsWithPlacementSummary({ limit: 15000 });
  const hotspotTargets = hotspots.map(mapHotspotToTarget);
  const hotspotTargetIds = new Set(hotspotTargets.map((target) => target.id));
  const staticTargets = fallbackTargets
    .filter((target) => !hotspotTargetIds.has(target.id))
    .map(attachSummaryToTarget);

  return [...hotspotTargets, ...staticTargets];
}

async function findTargetById(id) {
  if (!id) return null;

  if (String(id).startsWith("hotspot:")) {
    const hotspotId = String(id).slice("hotspot:".length);
    const hotspot = await getHotspotByIdWithPlacementSummary(hotspotId);

    if (!hotspot) return null;
    return mapHotspotToTarget(hotspot);
  }

  const fallbackTarget = fallbackTargets.find((target) => target.id === id);
  return fallbackTarget ? attachSummaryToTarget(fallbackTarget) : null;
}

async function requireTarget(id) {
  const target = await findTargetById(id);
  if (target) return target;

  const error = new Error("Placement target not found.");
  error.statusCode = 404;
  throw error;
}

function mapHotspotToTarget(hotspot) {
  return {
    id: `hotspot:${hotspot.id}`,
    hotspotId: hotspot.id,
    name: hotspot.name,
    zoneName:
      hotspot.regionName || hotspot.neighborhood || "Selected Zone",
    type: hotspot.category || "other",
    address: hotspot.address || "Address unavailable",
    lat: hotspot.lat,
    lng: hotspot.lng,
    allowedFlyering: true,
    busyLevel:
      hotspot.priority === "High"
        ? "high"
        : hotspot.priority === "Medium"
          ? "medium"
          : "low",
    status: hotspot.placementStatus || "not_started",
    latestSubmissionAt: hotspot.latestSubmissionAt || null,
    latestVerificationScore: hotspot.latestVerificationScore || null,
    latestSubmissionId: hotspot.latestSubmissionId || null,
    latestReviewReason: hotspot.latestReviewReason || null,
    verifiedCount: hotspot.verifiedCount || 0,
    expectedFlyerKeywords: [
      "lemontree",
      "foodhelpline.org",
      hotspot.name,
      hotspot.regionName,
      hotspot.neighborhood,
    ].filter(Boolean),
    campaignRef: hotspot.sourceKey || null,
  };
}

function attachSummaryToTarget(target) {
  const summary = getTargetSummary(target.id);

  return {
    ...target,
    ...summary,
    status: summary.placementStatus,
  };
}

module.exports = {
  listTargets,
  findTargetById,
  requireTarget,
  mapHotspotToTarget,
};
