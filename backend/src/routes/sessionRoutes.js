const express = require("express");
const {
  getAllSessions,
  getSessionById,
  createSession,
} = require("../controllers/sessionController");

const router = express.Router();

router.get("/", getAllSessions);
router.get("/:id", getSessionById);
router.post("/", createSession);

module.exports = router;
