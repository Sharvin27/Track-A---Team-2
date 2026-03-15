const {
  listSessions,
  findSessionById,
  saveSession,
} = require("../services/sessionService");

function getAllSessions(req, res) {
  const sessions = listSessions();

  res.status(200).json({
    success: true,
    count: sessions.length,
    data: sessions,
  });
}

function getSessionById(req, res) {
  const session = findSessionById(req.params.id);

  if (!session) {
    return res.status(404).json({
      success: false,
      message: "Session not found.",
    });
  }

  return res.status(200).json({
    success: true,
    data: session,
  });
}

function createSession(req, res) {
  try {
    const session = saveSession(req.body);

    return res.status(201).json({
      success: true,
      data: session,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Could not save session.",
    });
  }
}

module.exports = {
  getAllSessions,
  getSessionById,
  createSession,
};
