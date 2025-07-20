import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { Order, OrderStatus } from '../entities/Order';
import { OrderItem } from '../entities/OrderItem';
import { Product, ProductType } from '../entities/Product';
import { PaymentService } from '../services/paymentService';
import { AuthenticatedRequest } from '../types/custom';
import { BadRequestError, NotFoundError } from '../utils/ApiError';
import { asyncHandler } from '../utils/asyncHandler';

const orderRepository = AppDataSource.getRepository(Order);
const orderItemRepository = AppDataSource.getRepository(OrderItem);
const productRepository = AppDataSource.getRepository(Product);
const paymentService = new PaymentService();

/**
 * Create a new order (for fixed-price products)
 */
export const createOrder = asyncHandler(async (req: Request, res: Response) => {
  const authenticatedReq = req as AuthenticatedRequest;
  const { items, shippingAddress, notes } = req.body;
  const userId = authenticatedReq.user!.id;

  if (!items || !Array.isArray(items) || items.length === 0) {
    throw new BadRequestError("Order items are required");
  }

  // Validate and calculate total for each item
  let totalAmount = 0;
  const orderItems = [];

  for (const item of items) {
    const { productId, quantity } = item;

    if (!productId || !quantity || quantity <= 0) {
      throw new BadRequestError("Invalid item data");
    }

    const product = await productRepository.findOne({
      where: { id: productId, type: ProductType.FIXED_PRICE },
    });

    if (!product) {
      throw new NotFoundError(`Product ${productId} not found`);
    }

    if (product.status !== "active") {
      throw new BadRequestError(`Product ${product.name} is not available`);
    }

    if (product.stockQuantity < quantity) {
      throw new BadRequestError(`Insufficient stock for ${product.name}`);
    }

    const itemTotal = product.price * quantity;
    totalAmount += itemTotal;

    orderItems.push({
      productId,
      quantity,
      price: product.price,
      product,
    });
  }

  // Use transaction for atomic operations
  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    // Create the order
    const order = queryRunner.manager.create(Order, {
      userId,
      totalAmount,
      status: OrderStatus.PENDING_PAYMENT,
      shippingAddress,
      notes,
    });

    const savedOrder = await queryRunner.manager.save(Order, order);

    // Create order items and update stock
    for (const item of orderItems) {
      const orderItem = queryRunner.manager.create(OrderItem, {
        orderId: savedOrder.id,
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.price,
        totalPrice: item.price * item.quantity,
      });

      await queryRunner.manager.save(OrderItem, orderItem);

      // Update product stock
      await queryRunner.manager.update(Product, item.productId, {
        stockQuantity: item.product.stockQuantity - item.quantity,
      });
    }

    await queryRunner.commitTransaction();

    // Fetch complete order with items
    const completeOrder = await orderRepository.findOne({
      where: { id: savedOrder.id },
      relations: ["orderItems", "orderItems.product"],
    });

    // Create payment session with MyFatoorah
    let paymentResponse = null;
    
    if (paymentService.isConfigured()) {
      try {
        paymentResponse = await paymentService.createPaymentSession({
          orderId: savedOrder.id,
          amount: totalAmount,
          customerName: `${authenticatedReq.user!.firstName} ${authenticatedReq.user!.lastName}`,
          customerEmail: authenticatedReq.user!.email,
          customerAddress: shippingAddress,
        });

        // Update order with payment information
        await orderRepository.update(savedOrder.id, {
          paymentId: paymentResponse.data.paymentId.toString(),
          paymentUrl: paymentResponse.data.paymentURL,
        });

        // Fetch updated order
        const updatedOrder = await orderRepository.findOne({
          where: { id: savedOrder.id },
          relations: ["orderItems", "orderItems.product"],
        });

        res.status(201).json({
          success: true,
          message: "Order created successfully",
          data: {
            ...updatedOrder,
            payment: {
              paymentUrl: paymentResponse.data.paymentURL,
              invoiceId: paymentResponse.data.invoiceId,
              paymentId: paymentResponse.data.paymentId,
            },
          },
        });
      } catch (paymentError) {
        console.error("Payment session creation failed:", paymentError);
        
        // Order was created successfully, but payment failed
        res.status(201).json({
          success: true,
          message: "Order created successfully, but payment session failed",
          data: completeOrder,
          warning: "Payment session could not be created. Please contact support.",
        });
      }
    } else {
      // Payment service not configured
      res.status(201).json({
        success: true,
        message: "Order created successfully",
        data: completeOrder,
        warning: "Payment service not configured. Order is pending payment.",
      });
    }
  } catch (error) {
    await queryRunner.rollbackTransaction();
    throw error;
  } finally {
    await queryRunner.release();
  }
});
