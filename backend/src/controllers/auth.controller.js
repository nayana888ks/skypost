const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const userModel = require("../models/user.model");
const SALT_ROUNDS = 10;

async function signup(req, res) {
  const { username, email, password, displayName } = req.body;
  if (!username || !email || !password) return res.status(400).json({ error: "username, email, password are required" });
  const existing = await userModel.findByEmail(email);
  if (existing) return res.status(409).json({ error: "Email already registered" });
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await userModel.createUser({ username, email, passwordHash, displayName: displayName || username });
  const token = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET, { expiresIn: "7d" });
  res.status(201).json({ user, token });
}

async function login(req, res) {
  const { email, password } = req.body;
  const user = await userModel.findByEmail(email);
  if (!user) return res.status(401).json({ error: "Invalid email or password" });
  const passwordMatches = await bcrypt.compare(password, user.password_hash);
  if (!passwordMatches) return res.status(401).json({ error: "Invalid email or password" });
  const token = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET, { expiresIn: "7d" });
  res.json({ user: { id: user.id, username: user.username, display_name: user.display_name, avatar_url: user.avatar_url }, token });
}

module.exports = { signup, login };
