import express from "express";
import AuthController from "../controllers/authController.js";
import jwt from 'jsonwebtoken';

const router = express.Router();

router.post("/auth/tokens", AuthController.authenticateUser);
router.post("/auth/resets", AuthController.requestPasswordReset);
router.post("/auth/resets/:resetToken", AuthController.resetPasswordWithToken);

export default router;
