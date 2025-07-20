import { LessThanOrEqual, Repository } from 'typeorm';
import { AppDataSource } from '../config/database';
import { Bid } from '../entities/Bid';
import { Order, OrderStatus } from '../entities/Order';
import { OrderItem } from '../entities/OrderItem';
import { Product, ProductStatus, ProductType } from '../entities/Product';
import { NotificationService } from './notificationService';
import { PaymentService } from './paymentService';

export class AuctionService {
  private productRepository: Repository<Product>;
  private bidRepository: Repository<Bid>;
  private orderRepository: Repository<Order>;
  private orderItemRepository: Repository<OrderItem>;
  private paymentService: PaymentService;

  constructor() {
    this.productRepository = AppDataSource.getRepository(Product);
    this.bidRepository = AppDataSource.getRepository(Bid);
    this.orderRepository = AppDataSource.getRepository(Order);
    this.orderItemRepository = AppDataSource.getRepository(OrderItem);
    this.paymentService = new PaymentService();
  }

  /**
   * Process all ended auctions
   */
  async processEndedAuctions(): Promise<void> {
    try {
      const endedAuctions = await this.findEndedAuctions();
      
      if (endedAuctions.length === 0) {
        console.log('No ended auctions to process');
        return;
      }

      console.log(`Processing ${endedAuctions.length} ended auction(s)`);

      for (const auction of endedAuctions) {
        await this.processAuction(auction);
      }
    } catch (error) {
      console.error('Error processing ended auctions:', error);
      throw error;
    }
  }

  /**
   * Find all auctions that have ended but not yet processed
   */
  private async findEndedAuctions(): Promise<Product[]> {
    const now = new Date();
    
    return await this.productRepository.find({
      where: {
        type: ProductType.AUCTION,
        status: ProductStatus.ACTIVE,
        auctionEndTime: LessThanOrEqual(now)
      },
      relations: ['bids', 'bids.user']
    });
  }

  /**
   * Process a single ended auction
   */
  private async processAuction(auction: Product): Promise<void> {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Find the winning bid (highest bid)
      const winningBid = await this.findWinningBid(auction.id);

      if (!winningBid) {
        // No bids on this auction
        await queryRunner.manager.update(Product, auction.id, {
          status: ProductStatus.EXPIRED
        });
        
        console.log(`Auction ${auction.id} expired with no bids`);
        await queryRunner.commitTransaction();
        return;
      }

      // Create order for the winning bidder
      const order = await this.createWinnerOrder(winningBid, queryRunner.manager);

      // Update auction status to concluded
      await queryRunner.manager.update(Product, auction.id, {
        status: ProductStatus.CONCLUDED
      });

      await queryRunner.commitTransaction();

      // Create payment session for auction winner (outside transaction)
      await this.createPaymentForWinner(winningBid, order);

      // Send notification to winner (outside transaction)
      await this.notifyWinner(winningBid, order, auction);

      console.log(`Auction ${auction.id} concluded. Winner: ${winningBid.user.email}, Order: ${order.id}`);

    } catch (error) {
      await queryRunner.rollbackTransaction();
      console.error(`Error processing auction ${auction.id}:`, error);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Find the winning bid for an auction
   */
  private async findWinningBid(auctionId: string): Promise<Bid | null> {
    return await this.bidRepository.findOne({
      where: { productId: auctionId },
      relations: ['user'],
      order: { amount: 'DESC' }
    });
  }

  /**
   * Create an order for the auction winner
   */
  private async createWinnerOrder(winningBid: Bid, manager: any): Promise<Order> {
    // Create the order
    const order = manager.create(Order, {
      userId: winningBid.userId,
      totalAmount: winningBid.amount,
      status: OrderStatus.PENDING_PAYMENT,
      notes: `Auction winner - Product: ${winningBid.product?.name || 'Unknown'}`
    });

    const savedOrder = await manager.save(Order, order);

    // Create order item with proper pricing
    const orderItem = manager.create(OrderItem, {
      orderId: savedOrder.id,
      productId: winningBid.productId,
      quantity: 1,
      unitPrice: winningBid.amount,
      totalPrice: winningBid.amount
    });

    await manager.save(OrderItem, orderItem);

    return savedOrder;
  }

  /**
   * Create payment session for auction winner
   */
  private async createPaymentForWinner(winningBid: Bid, order: Order): Promise<void> {
    try {
      if (!this.paymentService.isConfigured()) {
        console.log('Payment service not configured. Skipping payment session creation for auction winner.');
        return;
      }

      const paymentResponse = await this.paymentService.createPaymentSession({
        orderId: order.id,
        amount: order.totalAmount,
        customerName: `${winningBid.user.firstName} ${winningBid.user.lastName}`,
        customerEmail: winningBid.user.email,
        customerAddress: order.shippingAddress || 'Auction winner - address to be provided',
      });

      // Update order with payment information
      await this.orderRepository.update(order.id, {
        paymentId: paymentResponse.data.paymentId.toString(),
        paymentUrl: paymentResponse.data.paymentURL,
      });

      console.log(`Payment session created for auction winner. Order: ${order.id}, Payment URL: ${paymentResponse.data.paymentURL}`);

    } catch (error) {
      console.error('Failed to create payment session for auction winner:', error);
      // Don't throw - payment failure shouldn't fail the auction conclusion
      // The order is still created and the winner can pay later
    }
  }

  /**
   * Send notification to auction winner
   */
  private async notifyWinner(winningBid: Bid, order: Order, auction: Product): Promise<void> {
    try {
      const title = '🎉 Congratulations! You won the auction!';
      const body = `You won the auction for "${auction.name}" with a bid of $${winningBid.amount}. Please complete your payment.`;
      
      const data = {
        type: 'auction_won',
        auctionId: auction.id,
        orderId: order.id,
        winningBid: winningBid.amount.toString(),
        productName: auction.name
      };

      await NotificationService.sendToUser(winningBid.userId, { title, body, data });
    } catch (error) {
      console.error('Failed to send winner notification:', error);
      // Don't throw - notification failure shouldn't fail the auction conclusion
    }
  }

  /**
   * Get auction statistics
   */
  async getAuctionStats(): Promise<{
    activeAuctions: number;
    endedAuctions: number;
    totalBids: number;
  }> {
    const [activeAuctions, endedAuctions, totalBids] = await Promise.all([
      this.productRepository.count({
        where: {
          type: ProductType.AUCTION,
          status: ProductStatus.ACTIVE
        }
      }),
      this.productRepository.count({
        where: {
          type: ProductType.AUCTION,
          status: ProductStatus.CONCLUDED
        }
      }),
      this.bidRepository.count()
    ]);

    return {
      activeAuctions,
      endedAuctions,
      totalBids
    };
  }
} 