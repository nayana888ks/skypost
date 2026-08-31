const express = require("express");
const router = express.Router();
const followController = require("../controllers/follow.controller");
const { requireAuth } = require("../middleware/auth");
router.post("/:userId", requireAuth, followController.follow);
router.delete("/:userId", requireAuth, followController.unfollow);
module.exports = router;
