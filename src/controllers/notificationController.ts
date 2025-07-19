import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { BadRequestError } from "../utils/ApiError";
import { NotificationService } from "../services/notificationService";

// Add FCM token for user
export const addFcmToken = asyncHandler(async (req: Request, res: Response) => {
  const { token } = req.body;
  const userId = (req as any).user.id;

  if (!token) {
    throw new BadRequestError("FCM token is required");
  }

  const success = await NotificationService.addFcmToken(userId, token);

  if (!success) {
    throw new BadRequestError("Failed to add FCM token");
  }

  res.json({
    success: true,
    message: "FCM token added successfully",
  });
});

// Remove FCM token for user
export const removeFcmToken = asyncHandler(async (req: Request, res: Response) => {
  const { token } = req.body;
  const userId = (req as any).user.id;

  if (!token) {
    throw new BadRequestError("FCM token is required");
  }

  const success = await NotificationService.removeFcmToken(userId, token);

  if (!success) {
    throw new BadRequestError("Failed to remove FCM token");
  }

  res.json({
    success: true,
    message: "FCM token removed successfully",
  });
});

// Test notification (for development/testing)
export const sendTestNotification = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user.id;

  const success = await NotificationService.sendToUser(userId, {
    title: "Test Notification",
    body: "This is a test notification from your e-commerce app!",
    data: {
      type: "test",
      timestamp: new Date().toISOString(),
    }
  });

  res.json({
    success: true,
    message: success ? "Test notification sent successfully" : "Failed to send test notification",
    notificationSent: success,
  });
}); 