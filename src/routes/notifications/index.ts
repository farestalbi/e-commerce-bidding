import { Router } from "express";
import {
  addFcmToken,
  removeFcmToken,
  sendTestNotification,
} from "../../controllers/notificationController";
import { authenticateToken } from "../../middleware/authentication";
import { validate, ValidationSource } from "../../middleware/validation";
import { addFcmTokenSchema, removeFcmTokenSchema } from "./notificationSchema";

const router = Router();

// All notification routes require authentication
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

router.post("/test", authenticateToken, sendTestNotification);

export default router; 