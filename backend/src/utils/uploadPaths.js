const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");

const uploadsRoot = path.join(__dirname, "../../uploads");
const placementProofsDir = path.join(uploadsRoot, "placement-proofs");

const extensionByMimeType = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/heic": ".heic",
};

function ensureUploadDirectories() {
  fs.mkdirSync(placementProofsDir, { recursive: true });
}

function getPlacementProofsDir() {
  ensureUploadDirectories();
  return placementProofsDir;
}

function createPlacementProofFileName({ mimeType, originalName }) {
  const fallbackExtension = path.extname(originalName || "").toLowerCase();
  const extension =
    extensionByMimeType[mimeType] || fallbackExtension || ".jpg";

  ensureUploadDirectories();

  return `${new Date().toISOString().replace(/[:.]/g, "-")}-${uuidv4()}${extension}`;
}

function getPlacementProofAbsolutePath(fileName) {
  return path.join(getPlacementProofsDir(), fileName);
}

function getStoredImagePath(fileName) {
  return path.posix.join("placement-proofs", fileName);
}

function getImageUrl(imagePath) {
  return `/uploads/${String(imagePath).replace(/\\/g, "/").replace(/^\/+/, "")}`;
}

module.exports = {
  ensureUploadDirectories,
  getPlacementProofsDir,
  createPlacementProofFileName,
  getPlacementProofAbsolutePath,
  getStoredImagePath,
  getImageUrl,
};
