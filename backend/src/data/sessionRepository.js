const fs = require("fs");
const path = require("path");

const storePath = path.join(__dirname, "sessionsStore.json");

function readSessions() {
  const file = fs.readFileSync(storePath, "utf8");
  return JSON.parse(file);
}

function writeSessions(sessions) {
  fs.writeFileSync(storePath, JSON.stringify(sessions, null, 2));
}

function getAllSessions() {
  return readSessions();
}

function getSessionById(id) {
  return readSessions().find((session) => session.id === id) ?? null;
}

function createSession(session) {
  const sessions = readSessions();
  sessions.unshift(session);
  writeSessions(sessions);
  return session;
}

module.exports = {
  getAllSessions,
  getSessionById,
  createSession,
};
