const express = require("express");
const {
  listPlacementTargets,
  getPlacementTarget,
  listPlacementTargetSubmissions,
  createPlacementSubmission,
  getPlacementSubmission,
} = require("../controllers/placementController");
const { placementUploadMiddleware } = require("../services/placementService");

const router = express.Router();

router.get("/placement-targets", listPlacementTargets);
router.get("/placement-targets/:id/submissions", listPlacementTargetSubmissions);
router.get("/placement-targets/:id", getPlacementTarget);
router.post(
  "/placement-submissions",
  placementUploadMiddleware,
  createPlacementSubmission,
);
router.get("/placement-submissions/:id", getPlacementSubmission);

module.exports = router;
