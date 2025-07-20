import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import passport from "passport";
import { User } from "../entities/User";
import { asyncHandler } from "../utils/asyncHandler";
import { jwtSecret, jwtExpiresIn, frontendUrl } from "../config/env";
import {
  BadRequestError,
  AuthFailureError,
  NotFoundError,
} from "../utils/ApiError";
import { AppDataSource } from "../config/database";
import { NotificationService } from "../services/notificationService";

// Register new user
export const register = asyncHandler(async (req: Request, res: Response) => {
  const { email, password, firstName, lastName } = req.body;

  const userRepository = AppDataSource.getRepository(User);

  // Check if user already exists
  const existingUser = await userRepository.findOne({ where: { email } });
  if (existingUser) {
    throw new BadRequestError("User with this email already exists");
  }

  // Hash password
  const saltRounds = 12;
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  // Create new user
  const user = userRepository.create({
    email,
    password: hashedPassword,
    firstName,
    lastName,
  });

  await userRepository.save(user);

  // Generate JWT token
  const token = jwt.sign({ userId: user.id, email: user.email }, jwtSecret, {
    expiresIn: jwtExpiresIn,
  } as jwt.SignOptions);

  // Remove password from response
  const { password: _, ...userWithoutPassword } = user;

  res.status(201).json({
    success: true,
    message: "User registered successfully",
    data: {
      user: userWithoutPassword,
      token,
    },
  });
});

// Login user
export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const userRepository = AppDataSource.getRepository(User);

  // Find user by email
  const user = await userRepository.findOne({ where: { email } });
  if (!user) {
    throw new AuthFailureError("Invalid email or password");
  }

  // Check if user is active
  if (!user.isActive) {
    throw new AuthFailureError("Account is deactivated");
  }

  // Verify password
  const isPasswordValid = await bcrypt.compare(password, user.password || "");
  if (!isPasswordValid) {
    throw new AuthFailureError("Invalid email or password");
  }

  // Generate JWT token
  const token = jwt.sign({ userId: user.id, email: user.email }, jwtSecret, {
    expiresIn: jwtExpiresIn,
  } as jwt.SignOptions);

  // Remove password from response
  const { password: _, ...userWithoutPassword } = user;

  res.json({
    success: true,
    message: "Login successful",
    data: {
      user: userWithoutPassword,
      token,
    },
  });
});

// Google OAuth login
export const googleAuth = passport.authenticate("google", {
  scope: ["profile", "email"],
});

// Google OAuth callback
export const googleAuthCallback = asyncHandler(
  async (req: Request, res: Response) => {
    passport.authenticate(
      "google",
      { session: false },
      async (err: any, user: any) => {
        if (err) {
          throw new AuthFailureError("Google authentication failed");
        }

        if (!user) {
          throw new AuthFailureError("Google authentication failed");
        }

        // Generate JWT token
        const token = jwt.sign(
          { userId: user.id, email: user.email },
          jwtSecret,
          { expiresIn: jwtExpiresIn } as jwt.SignOptions
        );

        // Remove password from response
        const { password: _, ...userWithoutPassword } = user;

        // Redirect to frontend with token
        res.redirect(
          `${frontendUrl}/auth/callback?token=${token}&user=${encodeURIComponent(
            JSON.stringify(userWithoutPassword)
          )}`
        );
      }
    )(req, res);
  }
);

// Get current user profile
export const getProfile = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user;

  if (!user) {
    throw new NotFoundError("User not found");
  }

  // Remove password from response
  const { password: _, ...userWithoutPassword } = user as any;

  res.json({
    success: true,
    data: {
      user: userWithoutPassword,
    },
  });
});

// Add FCM token
export const addFcmToken = asyncHandler(async (req: Request, res: Response) => {
  const { fcmToken } = req.body;
  const userId = (req as any).user.id;

  if (!fcmToken) {
    throw new BadRequestError("FCM token is required");
  }

  const success = await NotificationService.addFcmToken(userId, fcmToken);

  if (!success) {
    throw new BadRequestError("Failed to add FCM token");
  }

  res.json({
    success: true,
    message: "FCM token added successfully",
  });
});

// Remove FCM token
export const removeFcmToken = asyncHandler(async (req: Request, res: Response) => {
  const { fcmToken } = req.body;
  const userId = (req as any).user.id;

  if (!fcmToken) {
    throw new BadRequestError("FCM token is required");
  }

  const success = await NotificationService.removeFcmToken(userId, fcmToken);

  if (!success) {
    throw new BadRequestError("Failed to remove FCM token");
  }

  res.json({
    success: true,
    message: "FCM token removed successfully",
  });
});
