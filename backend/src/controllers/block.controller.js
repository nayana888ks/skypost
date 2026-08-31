const blockModel = require("../models/block.model");

async function block(req, res) {
  const blockerId = req.user.id, blockedId = parseInt(req.params.userId, 10);
  if (blockerId === blockedId) return res.status(400).json({ error: "You cannot block yourself" });
  await blockModel.blockUser(blockerId, blockedId);
  res.status(204).send();
}
async function unblock(req, res) {
  await blockModel.unblockUser(req.user.id, parseInt(req.params.userId, 10));
  res.status(204).send();
}
async function mute(req, res) {
  const muterId = req.user.id, mutedId = parseInt(req.params.userId, 10);
  if (muterId === mutedId) return res.status(400).json({ error: "You cannot mute yourself" });
  await blockModel.muteUser(muterId, mutedId);
  res.status(204).send();
}
async function unmute(req, res) {
  await blockModel.unmuteUser(req.user.id, parseInt(req.params.userId, 10));
  res.status(204).send();
}

module.exports = { block, unblock, mute, unmute };
