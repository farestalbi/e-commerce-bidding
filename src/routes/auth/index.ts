import { Router } from "express";
import {
  getProfile,
  googleAuth,
  googleAuthCallback,
  login,
  register,
  updateProfile,
} from "../../controllers/authController";
import { authenticateToken } from "../../middleware/authentication";
import { validate } from "../../middleware/validation";
import { loginSchema, registerSchema, updateProfileSchema } from "./authSchema";

const router = Router();

// Public routes
router.post("/register", validate(registerSchema), register);
router.post("/login", validate(loginSchema), login);

// Google OAuth routes
router.get("/google", googleAuth);
router.get("/google/callback", googleAuthCallback);

// Protected routes
router.get("/profile", authenticateToken, getProfile);
router.put(
  "/profile",
  authenticateToken,
  validate(updateProfileSchema),
  updateProfile
);

export default router;
