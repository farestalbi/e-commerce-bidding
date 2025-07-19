import admin from "firebase-admin";
import { AppDataSource } from "../config/database";
import { User } from "../entities/User";
import { firebaseProjectId, firebaseClientEmail, firebasePrivateKey } from "../config/env";

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  if (!firebaseProjectId || !firebaseClientEmail || !firebasePrivateKey) {
    console.warn("Firebase configuration is missing. Notifications will not work.");
  } else {
    try {
      // Ensure proper PEM format
      let formattedPrivateKey = firebasePrivateKey;

      // If the key doesn't start with -----BEGIN, it might be base64 encoded or malformed
      if (!formattedPrivateKey.includes("-----BEGIN PRIVATE KEY-----")) {
        console.warn(
          "Private key doesn't appear to be in PEM format. Skipping Firebase initialization."
        );
        console.warn(
          "Please ensure FIREBASE_PRIVATE_KEY is in proper PEM format starting with -----BEGIN PRIVATE KEY-----"
        );
      } else {
        // Replace literal \n with actual newlines
        formattedPrivateKey = formattedPrivateKey.replace(/\\n/g, "\n");

        const serviceAccount = {
          projectId: firebaseProjectId,
          clientEmail: firebaseClientEmail,
          privateKey: formattedPrivateKey,
        };

        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
        });
        
        console.log("Firebase Admin SDK initialized successfully");
      }
    } catch (error) {
      console.error("Failed to initialize Firebase Admin SDK:", error);
      console.warn("Notifications will not work until Firebase is properly configured.");
    }
  }
}

export interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
}

export class NotificationService {
  /**
   * Send notification to a single user
   */
  static async sendToUser(
    userId: string,
    payload: NotificationPayload
  ): Promise<boolean> {
    try {
      // Check if Firebase is initialized
      if (!admin.apps.length) {
        console.warn(
          "Firebase Admin SDK not initialized. Cannot send notification."
        );
        return false;
      }

      const userRepository = AppDataSource.getRepository(User);
      const user = await userRepository.findOne({ where: { id: userId } });

      if (!user || !user.fcmTokens || user.fcmTokens.length === 0) {
        console.log(`No FCM tokens found for user ${userId}`);
        return false;
      }

      const message = {
        notification: {
          title: payload.title,
          body: payload.body,
        },
        data: payload.data || {},
        tokens: user.fcmTokens.filter((token) => token && token.trim() !== ""), // Filter out empty tokens
      };

      const response = await admin.messaging().sendMulticast(message);

      // Handle failed tokens
      if (response.failureCount > 0) {
        const failedTokens: string[] = [];
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            failedTokens.push(user.fcmTokens[idx]);
            console.error(
              `Failed to send to token ${user.fcmTokens[idx]}:`,
              resp.error
            );
          }
        });

        // Remove invalid tokens from user
        if (failedTokens.length > 0) {
          await this.removeInvalidTokens(userId, failedTokens);
        }
      }

      console.log(
        `Notification sent to user ${userId}: ${response.successCount}/${user.fcmTokens.length} successful`
      );
      return response.successCount > 0;
    } catch (error) {
      console.error("Error sending notification:", error);
      return false;
    }
  }

  /**
   * Send notification to multiple users
   */
  static async sendToUsers(
    userIds: string[],
    payload: NotificationPayload
  ): Promise<number> {
    let successCount = 0;

    for (const userId of userIds) {
      const success = await this.sendToUser(userId, payload);
      if (success) successCount++;
    }

    return successCount;
  }

  /**
   * Send outbid notification
   */
  static async sendOutbidNotification(
    outbidUserId: string,
    productName: string,
    newBidAmount: number,
    productId: string
  ): Promise<boolean> {
    const payload: NotificationPayload = {
      title: "🚨 You've been outbid!",
      body: `Someone placed a higher bid of $${newBidAmount} on "${productName}". Place a new bid to stay in the auction!`,
      data: {
        type: "outbid",
        productId: productId,
        newBidAmount: newBidAmount.toString(),
        productName: productName,
        timestamp: new Date().toISOString(),
      },
    };
    return await this.sendToUser(outbidUserId, payload);
  }

  /**
   * Send auction won notification
   */
  static async sendAuctionWonNotification(
    winnerId: string,
    productName: string,
    winningBid: number,
    productId: string
  ): Promise<boolean> {
    const payload: NotificationPayload = {
      title: "🎉 Congratulations! You won the auction!",
      body: `You won "${productName}" with your bid of $${winningBid}. Complete your purchase now!`,
      data: {
        type: "auction_won",
        productId: productId,
        winningBid: winningBid.toString(),
        productName: productName,
        timestamp: new Date().toISOString(),
      },
    };

    return await this.sendToUser(winnerId, payload);
  }

  /**
   * Send auction ending soon notification
   */
  static async sendAuctionEndingSoonNotification(
    userIds: string[],
    productName: string,
    timeRemaining: string,
    productId: string
  ): Promise<number> {
    const payload: NotificationPayload = {
      title: "⏰ Auction ending soon!",
      body: `"${productName}" auction ends in ${timeRemaining}. Don't miss your chance!`,
      data: {
        type: "auction_ending_soon",
        productId: productId,
        productName: productName,
        timeRemaining: timeRemaining,
        timestamp: new Date().toISOString(),
      },
    };

    return await this.sendToUsers(userIds, payload);
  }

  /**
   * Remove invalid FCM tokens from user
   */
  private static async removeInvalidTokens(
    userId: string,
    invalidTokens: string[]
  ): Promise<void> {
    try {
      const userRepository = AppDataSource.getRepository(User);
      const user = await userRepository.findOne({ where: { id: userId } });

      if (user && user.fcmTokens) {
        user.fcmTokens = user.fcmTokens.filter(
          (token) => !invalidTokens.includes(token)
        );
        await userRepository.save(user);
        console.log(
          `Removed ${invalidTokens.length} invalid tokens from user ${userId}`
        );
      }
    } catch (error) {
      console.error("Error removing invalid tokens:", error);
    }
  }

  /**
   * Add FCM token to user
   */
  static async addFcmToken(userId: string, token: string): Promise<boolean> {
    try {
      const userRepository = AppDataSource.getRepository(User);
      const user = await userRepository.findOne({ where: { id: userId } });

      if (!user) {
        return false;
      }

      if (!user.fcmTokens) {
        user.fcmTokens = [];
      }

      // Add token if it doesn't already exist
      if (!user.fcmTokens.includes(token)) {
        user.fcmTokens.push(token);
        await userRepository.save(user);
        console.log(`Added FCM token for user ${userId}`);
      }

      return true;
    } catch (error) {
      console.error("Error adding FCM token:", error);
      return false;
    }
  }

  /**
   * Remove FCM token from user
   */
  static async removeFcmToken(userId: string, token: string): Promise<boolean> {
    try {
      const userRepository = AppDataSource.getRepository(User);
      const user = await userRepository.findOne({ where: { id: userId } });

      if (!user || !user.fcmTokens) {
        return false;
      }

      user.fcmTokens = user.fcmTokens.filter((t) => t !== token);
      await userRepository.save(user);
      console.log(`Removed FCM token for user ${userId}`);

      return true;
    } catch (error) {
      console.error("Error removing FCM token:", error);
      return false;
    }
  }
}
