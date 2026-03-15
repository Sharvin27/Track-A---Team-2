const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { query } = require("../db");

const SALT_ROUNDS = 12;
const JWT_SECRET = process.env.JWT_SECRET || "change-me-in-production";
const JWT_EXPIRES = "7d";

function sanitizeUser(row) {
  if (!row) return null;
  const { password_hash, ...user } = row;
  return user;
}

async function signup(req, res) {
  try {
    const { username, email, password } = req.body;
    if (!username?.trim() || !email?.trim() || !password) {
      return res.status(400).json({ error: "Username, email, and password are required." });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters." });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Invalid email format." });
    }

    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);
    const result = await query(
      `INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3)
       RETURNING id, username, email, agreed_to_terms, created_at`,
      [username.trim(), email.trim().toLowerCase(), password_hash]
    );
    const user = result.rows[0];
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES }
    );
    return res.status(201).json({ user: sanitizeUser(user), token });
  } catch (err) {
    if (err.code === "23505") {
      return res.status(409).json({ error: "Username or email already in use." });
    }
    console.error("Signup error:", err);
    return res.status(500).json({ error: "Registration failed." });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email?.trim() || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }

    const result = await query(
      "SELECT id, username, email, password_hash, agreed_to_terms, created_at FROM users WHERE email = $1",
      [email.trim().toLowerCase()]
    );
    const row = result.rows[0];
    if (!row) {
      return res.status(401).json({ error: "Invalid email or password." });
    }
    const match = await bcrypt.compare(password, row.password_hash);
    if (!match) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const user = sanitizeUser(row);
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES }
    );
    return res.json({ user, token });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ error: "Login failed." });
  }
}

async function me(req, res) {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!token) {
      return res.status(401).json({ error: "Not authenticated." });
    }
    const decoded = jwt.verify(token, JWT_SECRET);
    const result = await query(
      "SELECT id, username, email, agreed_to_terms, created_at FROM users WHERE id = $1",
      [decoded.userId]
    );
    const user = result.rows[0];
    if (!user) {
      return res.status(401).json({ error: "User not found." });
    }
    return res.json({ user });
  } catch (err) {
    if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Invalid or expired token." });
    }
    console.error("Me error:", err);
    return res.status(500).json({ error: "Failed to get user." });
  }
}

async function agreeToTerms(req, res) {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!token) {
      return res.status(401).json({ error: "Not authenticated." });
    }
    const decoded = jwt.verify(token, JWT_SECRET);
    await query(
      "UPDATE users SET agreed_to_terms = TRUE WHERE id = $1 RETURNING id, username, email, agreed_to_terms, created_at",
      [decoded.userId]
    );
    const result = await query(
      "SELECT id, username, email, agreed_to_terms, created_at FROM users WHERE id = $1",
      [decoded.userId]
    );
    return res.json({ user: result.rows[0] });
  } catch (err) {
    if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Invalid or expired token." });
    }
    console.error("Agree to terms error:", err);
    return res.status(500).json({ error: "Failed to update." });
  }
}

module.exports = { signup, login, me, agreeToTerms };
