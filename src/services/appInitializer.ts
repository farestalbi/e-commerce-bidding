import { SchedulerService } from './schedulerService';
import { auctionCheckInterval } from '../config/env';

export class AppInitializer {
  private static schedulerService: SchedulerService | null = null;

  /**
   * Initialize application services
   */
  static async initialize(): Promise<void> {
    try {
      console.log('Initializing application services...');

      // Initialize auction scheduler
      this.schedulerService = new SchedulerService();
      
      // Start scheduler with configurable intervals
      this.schedulerService.start(auctionCheckInterval);

      console.log('Application services initialized successfully');
    } catch (error) {
      console.error('Failed to initialize application services:', error);
      throw error;
    }
  }

  /**
   * Graceful shutdown
   */
  static async shutdown(): Promise<void> {
    try {
      console.log('Shutting down application services...');

      if (this.schedulerService) {
        this.schedulerService.stop();
      }

      console.log('Application services shut down successfully');
    } catch (error) {
      console.error('Error during shutdown:', error);
    }
  }

  /**
   * Get scheduler service instance
   */
  static getSchedulerService(): SchedulerService | null {
    return this.schedulerService;
  }
} 