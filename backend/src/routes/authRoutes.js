const express = require("express");
const router = express.Router();
const AuthController = require("../controllers/authController");
const jwt = require('jsonwebtoken');

router.post("/auth/tokens", AuthController.authenticateUser);
router.post("/auth/resets", AuthController.requestPasswordReset);
router.post("/auth/resets/:resetToken", AuthController.resetPasswordWithToken);

module.exports = router;