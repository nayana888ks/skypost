const express = require("express");
const router = express.Router();
const notificationController = require("../controllers/notification.controller");
const { requireAuth } = require("../middleware/auth");
router.get("/", requireAuth, notificationController.list);
router.get("/unread-count", requireAuth, notificationController.unreadCount);
router.post("/read", requireAuth, notificationController.markRead);
module.exports = router;
