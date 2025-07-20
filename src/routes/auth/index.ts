import { Router } from "express";
import {
  getProfile,
  googleAuth,
  googleAuthCallback,
  login,
  register,
  addFcmToken,
  removeFcmToken,
} from "../../controllers/authController";
import { authenticateToken } from "../../middleware/authentication";
import { validate, ValidationSource } from "../../middleware/validation";
import {
  addFcmTokenSchema,
  loginSchema,
  registerSchema,
  removeFcmTokenSchema,
} from "./authSchema";

const router = Router();

// Public routes
router.post("/register", validate(registerSchema), register);
router.post("/login", validate(loginSchema), login);

// Google OAuth routes
router.get("/google", googleAuth);
router.get("/google/callback", googleAuthCallback);

// Protected routes
router.get("/profile", authenticateToken, getProfile);

// FCM Token management routes
router.post(
  "/fcm-token",
  authenticateToken,
  validate(addFcmTokenSchema, ValidationSource.BODY),
  addFcmToken
);
router.delete(
  "/fcm-token",
  authenticateToken,
  validate(removeFcmTokenSchema, ValidationSource.BODY),
  removeFcmToken
);

export default router;
