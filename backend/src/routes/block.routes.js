const express = require("express");
const router = express.Router();
const blockController = require("../controllers/block.controller");
const { requireAuth } = require("../middleware/auth");
router.post("/block/:userId", requireAuth, blockController.block);
router.delete("/block/:userId", requireAuth, blockController.unblock);
router.post("/mute/:userId", requireAuth, blockController.mute);
router.delete("/mute/:userId", requireAuth, blockController.unmute);
module.exports = router;
