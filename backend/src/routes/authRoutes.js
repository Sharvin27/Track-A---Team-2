const express = require("express");
const { signup, login, me, agreeToTerms } = require("../controllers/authController");

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.get("/me", me);
router.post("/agree-terms", agreeToTerms);

module.exports = router;
