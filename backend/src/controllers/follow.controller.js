const followModel = require("../models/follow.model");
const blockModel = require("../models/block.model");
const notificationModel = require("../models/notification.model");

async function follow(req, res) {
  const followerId = req.user.id;
  const followingId = parseInt(req.params.userId, 10);
  if (followerId === followingId) return res.status(400).json({ error: "You cannot follow yourself" });
  const blocked = await blockModel.isBlocked(followerId, followingId);
  if (blocked) return res.status(403).json({ error: "Cannot follow this user" });
  await followModel.followUser(followerId, followingId);
  await notificationModel.createNotification({ recipientId: followingId, actorId: followerId, type: "follow" });
  res.status(204).send();
}

async function unfollow(req, res) {
  await followModel.unfollowUser(req.user.id, parseInt(req.params.userId, 10));
  res.status(204).send();
}

module.exports = { follow, unfollow };
