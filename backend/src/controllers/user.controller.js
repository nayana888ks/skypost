const userModel = require("../models/user.model");
const tweetModel = require("../models/tweet.model");
const blockModel = require("../models/block.model");

async function listUsers(req, res) {
  res.json(await userModel.listAll());
}

async function getSuggestions(req, res) {
  res.json(await userModel.getSuggestions(req.user.id));
}

async function getProfile(req, res) {
  const user = await userModel.findByUsername(req.params.username);
  if (!user) return res.status(404).json({ error: "User not found" });
  const viewerId = req.user?.id || null;
  const tweets = await tweetModel.getRecentTweetsByUser(user.id, 20, viewerId);
  const stats = await userModel.getStats(user.id);
  let relation = null;
  if (viewerId && viewerId !== user.id) relation = { blocked: await blockModel.isBlocked(viewerId, user.id) };
  res.json({ user, tweets, stats, relation });
}

async function updateMyProfile(req, res) {
  const { displayName, bio, avatarUrl } = req.body;
  res.json(await userModel.updateProfile(req.user.id, { displayName, bio, avatarUrl }));
}

module.exports = { listUsers, getSuggestions, getProfile, updateMyProfile };
