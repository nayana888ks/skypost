const express = require("express");
const router = express.Router();
const userController = require("../controllers/user.controller");
const { requireAuth, optionalAuth } = require("../middleware/auth");
router.get("/suggestions", requireAuth, userController.getSuggestions);
router.get("/", userController.listUsers);
router.put("/me", requireAuth, userController.updateMyProfile);
router.get("/:username", optionalAuth, userController.getProfile);
module.exports = router;
