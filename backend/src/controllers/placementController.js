const {
  getAllPlacementTargets,
  getPlacementTargetById,
  getPlacementSubmissionsForTarget,
  getPlacementSubmissionById,
  submitPlacementSubmission,
} = require("../services/placementService");

function listPlacementTargets(req, res) {
  try {
    const targets = getAllPlacementTargets();

    res.status(200).json({
      success: true,
      count: targets.length,
      data: targets,
    });
  } catch (error) {
    handlePlacementError(res, error);
  }
}

function getPlacementTarget(req, res) {
  try {
    const target = getPlacementTargetById(req.params.id);

    res.status(200).json({
      success: true,
      data: target,
    });
  } catch (error) {
    handlePlacementError(res, error);
  }
}

function listPlacementTargetSubmissions(req, res) {
  try {
    const submissions = getPlacementSubmissionsForTarget(req.params.id);

    res.status(200).json({
      success: true,
      count: submissions.length,
      data: submissions,
    });
  } catch (error) {
    handlePlacementError(res, error);
  }
}

async function createPlacementSubmission(req, res) {
  try {
    const result = await submitPlacementSubmission({
      body: req.body || {},
      file: req.file,
    });

    res.status(200).json({
      success: true,
      data: result.response,
    });
  } catch (error) {
    handlePlacementError(res, error);
  }
}

function getPlacementSubmission(req, res) {
  try {
    const submission = getPlacementSubmissionById(req.params.id);

    if (!submission) {
      res.status(404).json({
        success: false,
        message: "Placement submission not found.",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: submission,
    });
  } catch (error) {
    handlePlacementError(res, error);
  }
}

function handlePlacementError(res, error) {
  res.status(error.statusCode || 400).json({
    success: false,
    message:
      error instanceof Error ? error.message : "Placement verification failed.",
  });
}

module.exports = {
  listPlacementTargets,
  getPlacementTarget,
  listPlacementTargetSubmissions,
  createPlacementSubmission,
  getPlacementSubmission,
};
