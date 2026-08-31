const notificationModel = require("../models/notification.model");

async function list(req, res) { res.json(await notificationModel.getNotifications(req.user.id)); }
async function unreadCount(req, res) { res.json({ count: await notificationModel.getUnreadCount(req.user.id) }); }
async function markRead(req, res) { await notificationModel.markAllRead(req.user.id); res.status(204).send(); }

module.exports = { list, unreadCount, markRead };
