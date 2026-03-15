const sharp = require("sharp");
const { extractTextFromImage } = require("./ocrService");
const { detectQrCode } = require("./qrService");
const { findDuplicateForTarget } = require("../data/placementRepository");
const { hashBuffer } = require("../utils/fileHash");
const { haversineDistanceMeters } = require("../utils/haversine");

const ACCEPTED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const DUPLICATE_COOLDOWN_HOURS = 24;
const BASE_FLYER_KEYWORDS = [
  "lemontree",
  "foodhelpline.org",
  "free food near",
  "free groceries",
  "free meals",
];
const ACCEPTED_QR_HOSTNAMES = new Set([
  "foodhelpline.org",
  "platform.foodhelpline.org",
]);

async function verifyPlacementEvidence({
  file,
  target,
  gpsLat,
  gpsLng,
}) {
  validateUploadedFile(file);

  const imageHash = hashBuffer(file.buffer);
  const duplicate = findDuplicateForTarget(target.id, imageHash, {
    cooldownHours: DUPLICATE_COOLDOWN_HOURS,
  });

  let metadata;
  let stats;
  let normalizedPngBuffer;
  let edgeMean = 0;

  try {
    const image = sharp(file.buffer, { failOn: "error" }).rotate();
    metadata = await image.metadata();
    stats = await image.clone().stats();
    normalizedPngBuffer = await image.clone().png().toBuffer();
    const edgeBuffer = await image
      .clone()
      .grayscale()
      .resize({ width: 512, height: 512, fit: "inside", withoutEnlargement: true })
      .convolve({
        width: 3,
        height: 3,
        kernel: [0, -1, 0, -1, 4, -1, 0, -1, 0],
      })
      .raw()
      .toBuffer({ resolveWithObject: true });
    edgeMean = calculateAverage(edgeBuffer.data);
  } catch (error) {
    const corruptError = new Error("The uploaded image is corrupted or unreadable.");
    corruptError.statusCode = 400;
    throw corruptError;
  }

  const ocrResult = await extractTextFromImage(normalizedPngBuffer);
  const qrResult = await detectQrCode(normalizedPngBuffer);

  const ocrMatches = findOcrMatches(ocrResult.text, target);
  const ocrScore = scoreOcrMatches(ocrMatches.length);
  const { qrDetected, qrValue, qrScore } = scoreQrResult(qrResult, target);
  const { distanceMeters, gpsScore } = scoreGpsDistance({
    gpsLat,
    gpsLng,
    targetLat: target.lat,
    targetLng: target.lng,
  });
  const { imageQualityScore } = assessImageQuality({
    metadata,
    stats,
    edgeMean,
    ocrText: ocrResult.text,
    qrDetected,
  });
  const duplicateScore = duplicate.exactDuplicate ? 0 : 10;

  let verificationScore =
    gpsScore + ocrScore + qrScore + imageQualityScore + duplicateScore;
  let status = "rejected";
  let reviewReason = "The photo did not include enough placement evidence.";

  if (duplicate.exactVerified) {
    verificationScore = Math.min(verificationScore, 54);
    reviewReason =
      "This exact image was already verified for this hotspot. Please upload a fresh photo.";
  } else if (duplicate.withinCooldown) {
    verificationScore = Math.min(verificationScore, 54);
    reviewReason =
      "This exact image was already submitted for this hotspot recently. Please take a new photo.";
  } else if (
    verificationScore >= 80 &&
    distanceMeters !== null &&
    distanceMeters <= 75 &&
    (ocrScore > 0 || qrScore > 0)
  ) {
    status = "verified";
    reviewReason = "Placement evidence verified automatically.";
  } else if (verificationScore >= 55) {
    status = "pending_review";
    reviewReason = buildPendingReviewReason({
      gpsScore,
      ocrScore,
      qrScore,
      distanceMeters,
    });
  } else {
    reviewReason = buildRejectedReason({
      gpsScore,
      ocrScore,
      qrScore,
      imageQualityScore,
      distanceMeters,
      duplicate,
    });
  }

  return {
    imageHash,
    ocrText: (ocrResult.text || "").trim(),
    ocrMatches,
    qrDetected,
    qrValue,
    imageQualityScore,
    duplicateScore,
    gpsScore,
    ocrScore,
    qrScore,
    verificationScore,
    status,
    reviewReason,
    distanceMeters:
      typeof distanceMeters === "number" ? Number(distanceMeters.toFixed(2)) : null,
  };
}

function validateUploadedFile(file) {
  if (!file) {
    const error = new Error("A proof image is required.");
    error.statusCode = 400;
    throw error;
  }

  if (!ACCEPTED_MIME_TYPES.has(file.mimetype)) {
    const error = new Error("Unsupported file type. Upload a JPEG, PNG, or WEBP image.");
    error.statusCode = 400;
    throw error;
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    const error = new Error("Image is too large. Files must be 10 MB or smaller.");
    error.statusCode = 400;
    throw error;
  }
}

function scoreGpsDistance({ gpsLat, gpsLng, targetLat, targetLng }) {
  if (!Number.isFinite(gpsLat) || !Number.isFinite(gpsLng)) {
    return {
      distanceMeters: null,
      gpsScore: 0,
    };
  }

  const distanceMeters = haversineDistanceMeters(gpsLat, gpsLng, targetLat, targetLng);

  if (distanceMeters <= 20) return { distanceMeters, gpsScore: 35 };
  if (distanceMeters <= 50) return { distanceMeters, gpsScore: 28 };
  if (distanceMeters <= 75) return { distanceMeters, gpsScore: 18 };
  if (distanceMeters <= 100) return { distanceMeters, gpsScore: 8 };

  return {
    distanceMeters,
    gpsScore: 0,
  };
}

function findOcrMatches(ocrText, target) {
  const normalizedText = normalizeText(ocrText);
  if (!normalizedText) return [];

  const targetKeywords = Array.isArray(target.expectedFlyerKeywords)
    ? target.expectedFlyerKeywords
    : [];
  const allKeywords = [...BASE_FLYER_KEYWORDS, ...targetKeywords, target.campaignRef]
    .filter(Boolean)
    .map((entry) => String(entry));
  const matches = [];

  for (const keyword of allKeywords) {
    const normalizedKeyword = normalizeText(keyword);
    if (normalizedKeyword && normalizedText.includes(normalizedKeyword)) {
      matches.push(keyword);
    }
  }

  return Array.from(new Set(matches));
}

function scoreOcrMatches(matchCount) {
  if (matchCount >= 3) return 25;
  if (matchCount === 2) return 18;
  if (matchCount === 1) return 10;
  return 0;
}

function scoreQrResult(qrResult, target) {
  if (!qrResult?.detected) {
    return {
      qrDetected: false,
      qrValue: null,
      qrScore: 0,
    };
  }

  const qrValue = qrResult.value || null;
  const valid = qrValue ? isAcceptedQrValue(qrValue, target) : false;

  return {
    qrDetected: true,
    qrValue,
    qrScore: valid ? 20 : 10,
  };
}

function isAcceptedQrValue(qrValue, target) {
  const normalized = String(qrValue).trim().toLowerCase();
  const campaignRef = String(target.campaignRef || "").trim().toLowerCase();

  if (normalized.includes("lemontree")) return true;
  if (campaignRef && normalized.includes(campaignRef)) return true;

  try {
    const parsed = new URL(normalized);
    if (ACCEPTED_QR_HOSTNAMES.has(parsed.hostname)) {
      return true;
    }
  } catch (error) {
    return normalized.includes("foodhelpline.org");
  }

  return normalized.includes("foodhelpline.org");
}

function assessImageQuality({ metadata, stats, edgeMean, ocrText, qrDetected }) {
  const width = metadata?.width || 0;
  const height = metadata?.height || 0;
  const longestEdge = Math.max(width, height);
  const brightness = calculateAverage(
    (stats?.channels || []).map((channel) => channel.mean),
  );
  const textDetected = Boolean((ocrText || "").trim().length >= 20 || qrDetected);

  if (!width || !height || longestEdge < 300) {
    return { imageQualityScore: 0 };
  }

  const dimensionsStrong = width >= 1200 || height >= 1200;
  const dimensionsOkay = width >= 600 || height >= 600;
  const brightnessStrong = brightness >= 70 && brightness <= 210;
  const brightnessOkay = brightness >= 45 && brightness <= 235;
  const sharpStrong = edgeMean >= 18;
  const sharpOkay = edgeMean >= 10;

  const strongSignals = [
    dimensionsStrong,
    brightnessStrong,
    sharpStrong,
    textDetected,
  ].filter(Boolean).length;
  const okaySignals = [
    dimensionsOkay,
    brightnessOkay,
    sharpOkay,
  ].filter(Boolean).length;

  if (strongSignals >= 3) {
    return { imageQualityScore: 10 };
  }

  if (strongSignals + okaySignals >= 3) {
    return { imageQualityScore: 6 };
  }

  if (dimensionsOkay || brightnessOkay || sharpOkay) {
    return { imageQualityScore: 2 };
  }

  return { imageQualityScore: 0 };
}

function buildPendingReviewReason({ gpsScore, ocrScore, qrScore, distanceMeters }) {
  if (!Number.isFinite(distanceMeters)) {
    return "Photo uploaded without GPS, so the submission needs manual review.";
  }

  if (gpsScore < 18) {
    return "Photo evidence was captured, but the submitted location is farther from the hotspot than expected.";
  }

  if (ocrScore === 0 && qrScore === 0) {
    return "The flyer text or QR proof was weak, so the submission was queued for review.";
  }

  return "The submission shows promising evidence and is waiting for manual review.";
}

function buildRejectedReason({
  gpsScore,
  ocrScore,
  qrScore,
  imageQualityScore,
  distanceMeters,
  duplicate,
}) {
  if (duplicate.exactVerified) {
    return "This exact image was already verified for the hotspot.";
  }

  if (duplicate.withinCooldown) {
    return "This exact image was already submitted recently for the hotspot.";
  }

  if (imageQualityScore === 0) {
    return "The uploaded photo is too dark, blurry, or small to verify.";
  }

  if (Number.isFinite(distanceMeters) && distanceMeters > 100) {
    return "The submitted GPS location is too far from the hotspot.";
  }

  if (gpsScore === 0 && ocrScore === 0 && qrScore === 0) {
    return "The submission did not include enough GPS, text, or QR evidence.";
  }

  return "The submission did not meet the automatic verification threshold.";
}

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function calculateAverage(values) {
  if (!values?.length) return 0;
  return values.reduce((total, value) => total + value, 0) / values.length;
}

module.exports = {
  ACCEPTED_MIME_TYPES,
  MAX_FILE_SIZE_BYTES,
  verifyPlacementEvidence,
};
