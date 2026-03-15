const repository = require("../data/sessionRepository");

function listSessions() {
  return repository.getAllSessions();
}

function findSessionById(id) {
  return repository.getSessionById(id);
}

function validateSessionPayload(payload) {
  if (!payload || typeof payload !== "object") {
    return "Session payload is required.";
  }

  if (!payload.id || !payload.startTime || !payload.status) {
    return "Session payload is missing required fields.";
  }

  if (!Array.isArray(payload.routePoints) || !Array.isArray(payload.stops)) {
    return "Session routePoints and stops must be arrays.";
  }

  return null;
}

function saveSession(payload) {
  const validationError = validateSessionPayload(payload);

  if (validationError) {
    const error = new Error(validationError);
    error.statusCode = 400;
    throw error;
  }

  return repository.createSession(payload);
}

module.exports = {
  listSessions,
  findSessionById,
  saveSession,
};
