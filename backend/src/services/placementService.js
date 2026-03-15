const fs = require("fs");
const multer = require("multer");
const { v4: uuidv4 } = require("uuid");
const {
  createSubmission,
  listSubmissionsForTarget,
  getSubmissionById,
} = require("../data/placementRepository");
const {
  verifyPlacementEvidence,
  ACCEPTED_MIME_TYPES,
  MAX_FILE_SIZE_BYTES,
} = require("./imageVerificationService");
const { listTargets, requireTarget } = require("./targetService");
const {
  ensureUploadDirectories,
  createPlacementProofFileName,
  getPlacementProofAbsolutePath,
  getStoredImagePath,
  getImageUrl,
} = require("../utils/uploadPaths");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE_BYTES,
  },
  fileFilter(req, file, callback) {
    if (!ACCEPTED_MIME_TYPES.has(file.mimetype)) {
      callback(
        new Error("Unsupported file type. Upload a JPEG, PNG, or WEBP image."),
      );
      return;
    }

    callback(null, true);
  },
});

function placementUploadMiddleware(req, res, next) {
  upload.single("image")(req, res, (error) => {
    if (!error) {
      next();
      return;
    }

    if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
      res.status(400).json({
        success: false,
        message: "Image is too large. Files must be 10 MB or smaller.",
      });
      return;
    }

    res.status(400).json({
      success: false,
      message:
        error.message ||
        "Unsupported file type. Upload a JPEG, PNG, or WEBP image.",
    });
  });
}

async function getAllPlacementTargets() {
  return listTargets();
}

async function getPlacementTargetById(id) {
  return requireTarget(id);
}

async function getPlacementSubmissionsForTarget(id) {
  await requireTarget(id);
  return listSubmissionsForTarget(id);
}

function getPlacementSubmissionById(id) {
  return getSubmissionById(id);
}

async function submitPlacementSubmission({ body, file }) {
  ensureUploadDirectories();

  const normalizedTargetId = normalizeTargetId(body.targetId, body.hotspotId);
  const target = await requireTarget(normalizedTargetId);
  const verification = await verifyPlacementEvidence({
    file,
    target,
    gpsLat: parseNullableNumber(body.gpsLat),
    gpsLng: parseNullableNumber(body.gpsLng),
  });
  const fileName = createPlacementProofFileName({
    mimeType: file.mimetype,
    originalName: file.originalname,
  });
  const imagePath = getStoredImagePath(fileName);
  const submission = {
    id: uuidv4(),
    targetId: target.id,
    hotspotId:
      target.hotspotId || body.hotspotId ? String(target.hotspotId || body.hotspotId) : null,
    userId: cleanString(body.userId) || "guest",
    campaignRef: cleanString(body.campaignRef) || target.campaignRef || null,
    imagePath,
    imageHash: verification.imageHash,
    mimeType: file.mimetype,
    fileSizeBytes: file.size,
    submittedAt: new Date().toISOString(),
    capturedAt: parseNullableIsoDate(body.capturedAt),
    gpsLat: parseNullableNumber(body.gpsLat),
    gpsLng: parseNullableNumber(body.gpsLng),
    gpsAccuracy: parseNullableNumber(body.gpsAccuracy),
    distanceMeters: verification.distanceMeters,
    ocrText: verification.ocrText,
    ocrMatches: verification.ocrMatches,
    qrDetected: verification.qrDetected,
    qrValue: verification.qrValue,
    imageQualityScore: verification.imageQualityScore,
    duplicateScore: verification.duplicateScore,
    gpsScore: verification.gpsScore,
    ocrScore: verification.ocrScore,
    qrScore: verification.qrScore,
    verificationScore: verification.verificationScore,
    status: verification.status,
    reviewReason: verification.reviewReason,
    notes: cleanString(body.notes) || null,
  };

  fs.writeFileSync(getPlacementProofAbsolutePath(fileName), file.buffer);
  createSubmission(submission);

  return {
    submission,
    response: {
      submissionId: submission.id,
      targetId: submission.targetId,
      hotspotId: submission.hotspotId || undefined,
      status: submission.status,
      verificationScore: submission.verificationScore,
      reviewReason: submission.reviewReason,
      verificationBreakdown: {
        gpsScore: submission.gpsScore,
        ocrScore: submission.ocrScore,
        qrScore: submission.qrScore,
        imageQualityScore: submission.imageQualityScore,
        duplicateScore: submission.duplicateScore,
      },
      distanceMeters: submission.distanceMeters,
      ocrMatches: submission.ocrMatches,
      qrDetected: submission.qrDetected,
      qrValue: submission.qrValue,
      imageUrl: getImageUrl(submission.imagePath),
    },
  };
}

function normalizeTargetId(targetId, hotspotId) {
  const cleanedTargetId = cleanString(targetId);
  if (cleanedTargetId) return cleanedTargetId;

  const cleanedHotspotId = cleanString(hotspotId);
  if (cleanedHotspotId) return `hotspot:${cleanedHotspotId}`;

  const error = new Error("A placement target is required.");
  error.statusCode = 400;
  throw error;
}

function parseNullableNumber(value) {
  if (value === undefined || value === null || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseNullableIsoDate(value) {
  const cleaned = cleanString(value);
  if (!cleaned) return null;
  const timestamp = new Date(cleaned);

  return Number.isNaN(timestamp.getTime()) ? null : timestamp.toISOString();
}

function cleanString(value) {
  if (typeof value !== "string") return "";
  return value.trim();
}

module.exports = {
  placementUploadMiddleware,
  getAllPlacementTargets,
  getPlacementTargetById,
  getPlacementSubmissionsForTarget,
  getPlacementSubmissionById,
  submitPlacementSubmission,
};
