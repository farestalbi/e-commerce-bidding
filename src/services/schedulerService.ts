import { AuctionService } from './auctionService';

export class SchedulerService {
  private auctionService: AuctionService;
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning = false;

  constructor() {
    this.auctionService = new AuctionService();
  }

  /**
   * Start the auction conclusion scheduler
   */
  start(intervalMinutes: number = 5): void {
    if (this.isRunning) {
      console.log('Scheduler is already running');
      return;
    }

    console.log(`Starting auction scheduler - checking every ${intervalMinutes} minutes`);

    // Run immediately on start
    this.processAuctions();

    // Set up recurring interval
    this.intervalId = setInterval(() => {
      this.processAuctions();
    }, intervalMinutes * 60 * 1000); // Convert minutes to milliseconds

    this.isRunning = true;
  }

  /**
   * Stop the auction conclusion scheduler
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log('Auction scheduler stopped');
  }

  /**
   * Process ended auctions
   */
  private async processAuctions(): Promise<void> {
    try {
      console.log(`[${new Date().toISOString()}] Checking for ended auctions...`);
      await this.auctionService.processEndedAuctions();
    } catch (error) {
      console.error('Error in scheduled auction processing:', error);
    }
  }

  /**
   * Get scheduler status
   */
  getStatus(): { isRunning: boolean; intervalId: number | null } {
    return {
      isRunning: this.isRunning,
      intervalId: this.intervalId ? Number(this.intervalId) : null
    };
  }

  /**
   * Get auction statistics
   */
  async getAuctionStats(): Promise<any> {
    return await this.auctionService.getAuctionStats();
  }
} 