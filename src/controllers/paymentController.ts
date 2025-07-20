import { Request, Response } from "express";
import { AppDataSource } from "../config/database";
import { Order, OrderStatus } from "../entities/Order";
import { PaymentService } from "../services/paymentService";
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";
import * as crypto from "crypto";
import { myFatoorahApiKey } from "../config/env";

const orderRepository = AppDataSource.getRepository(Order);
const paymentService = new PaymentService();

//Verifies the MyFatoorah webhook signature
function verifyWebhookSignature(data: any, signature: string): boolean {
  try {
    if (!signature || !data) {
      console.warn("Webhook signature or data missing");
      return false;
    }

    const apiKey = myFatoorahApiKey;
    if (!apiKey) {
      console.error("Missing MYFATOORAH_API_KEY in environment variables");
      return false;
    }

    // Get the raw request body as string
    const rawBody = typeof data === "string" ? data : JSON.stringify(data);

    // Create HMAC SHA256 using API key as secret
    const hmac = crypto.createHmac("sha256", apiKey);
    hmac.update(rawBody);
    const expectedSignature = hmac.digest("hex");

    const isValid = signature.toLowerCase() === expectedSignature.toLowerCase();

    if (!isValid) {
      console.error("Webhook signature verification failed:", {
        received: signature,
        expected: expectedSignature,
        bodyLength: rawBody.length,
        bodyPreview: rawBody.substring(0, 200) + "...",
      });
    } else {
      console.log("Webhook signature verification successful");
    }

    return isValid;
  } catch (error) {
    console.error("Error verifying MyFatoorah signature:", error);
    return false;
  }
}

/**
 * Send payment status notification to user
 */
async function sendPaymentStatusNotification(
  order: Order,
  newStatus: string
): Promise<void> {
  try {
    const { NotificationService } = await import(
      "../services/notificationService"
    );

    let title = "";
    let body = "";

    switch (newStatus) {
      case "PAID":
        title = "✅ Payment Successful!";
        body = `Your payment for order ${order.id} has been confirmed. Your order is being processed.`;
        break;
      case "FAILED":
        title = "❌ Payment Failed";
        body = `Your payment for order ${order.id} failed. Please try again or contact support.`;
        break;
      case "PENDING_PAYMENT":
        title = "⏳ Payment Pending";
        body = `Your payment for order ${order.id} is being processed. We'll notify you once it's confirmed.`;
        break;
      default:
        title = "📋 Payment Update";
        body = `Your payment status for order ${order.id} has been updated to: ${newStatus}`;
    }

    await NotificationService.sendToUser(order.userId, {
      title,
      body,
      data: {
        type: "payment_status_update",
        orderId: order.id,
        status: newStatus,
        amount: order.totalAmount.toString(),
      },
    });

    console.log(
      `Payment status notification sent to user ${order.userId} for order ${order.id}`
    );
  } catch (error) {
    console.error("Failed to send payment status notification:", error);
  }
}

/**
 * Handle MyFatoorah payment callback
 */
export const handlePaymentCallback = asyncHandler(
  async (req: Request, res: Response) => {
    const callbackData = req.body;
    const signature = req.headers["x-signature"] as string;
    const rawBody = JSON.stringify(callbackData); // Convert to string for signature verification

    try {
      // Log incoming webhook for debugging
      console.log("MyFatoorah webhook received:", {
        signature: signature ? "Present" : "Missing",
        bodyLength: rawBody.length,
        bodyPreview: rawBody.substring(0, 200) + "...",
      });

      // Verify webhook signature using raw body
      if (signature && !verifyWebhookSignature(rawBody, signature)) {
        console.error("Webhook signature verification failed");
        throw new ForbiddenError("Invalid webhook signature");
      }

      // Validate required callback data
      if (!callbackData || !callbackData.InvoiceId) {
        console.error("Invalid callback data structure:", callbackData);
        throw new BadRequestError("Invalid callback data structure");
      }

      // Process the callback data
      const result = await paymentService.processPaymentCallback(callbackData);

      if (!result.isSuccess) {
        console.error("Payment callback processing failed:", result);
        throw new BadRequestError("Invalid callback data");
      }

      // Find and update the order
      const order = await orderRepository.findOne({
        where: { id: result.orderId },
      });

      if (!order) {
        console.error("Order not found for callback:", result.orderId);
        throw new NotFoundError("Order not found");
      }

      // Log the payment status change
      console.log(
        `Payment status change for order ${result.orderId}: ${order.status} → ${result.status}`
      );

      // Update order status
      await orderRepository.update(result.orderId, {
        status: result.status as OrderStatus,
      });

      // Send notification to user about payment status change
      await sendPaymentStatusNotification(order, result.status);

      // Log successful callback processing
      console.log(
        `Payment callback processed successfully for order ${result.orderId}: ${result.status}`
      );

      res.json({
        success: true,
        message: "Payment callback processed successfully",
      });
    } catch (error) {
      console.error("Payment callback processing error:", error);

      // Return appropriate error response
      if (error instanceof ForbiddenError) {
        res.status(403).json({
          success: false,
          message: "Webhook signature verification failed",
        });
      } else if (error instanceof BadRequestError) {
        res.status(400).json({
          success: false,
          message: error.message,
        });
      } else if (error instanceof NotFoundError) {
        res.status(404).json({
          success: false,
          message: "Order not found",
        });
      } else {
        res.status(500).json({
          success: false,
          message: "Internal server error processing webhook",
        });
      }
    }
  }
);
