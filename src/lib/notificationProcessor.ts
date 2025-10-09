import { NotificationService } from './notifications';

export class NotificationProcessor {
  private static isRunning = false;
  private static intervalId: NodeJS.Timeout | null = null;

  // Start the notification processor
  static start(intervalMs = 5000): void {
    if (this.isRunning) {
      console.log('Notification processor is already running');
      return;
    }

    console.log('Starting notification processor...');
    this.isRunning = true;

    // Process queue immediately
    this.processQueue();

    // Set up interval processing
    this.intervalId = setInterval(() => {
      this.processQueue();
    }, intervalMs);
  }

  // Stop the notification processor
  static stop(): void {
    if (!this.isRunning) {
      console.log('Notification processor is not running');
      return;
    }

    console.log('Stopping notification processor...');
    this.isRunning = false;

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  // Process the notification queue
  private static async processQueue(): Promise<void> {
    if (!this.isRunning) return;

    try {
      await NotificationService.processQueue();
    } catch (error) {
      console.error('Error in notification processor:', error);
    }
  }

  // Get processor status
  static getStatus(): { isRunning: boolean; intervalId: NodeJS.Timeout | null } {
    return {
      isRunning: this.isRunning,
      intervalId: this.intervalId
    };
  }
}

// Auto-start processor in production
if (process.env.NODE_ENV === 'production' && process.env.AUTO_START_NOTIFICATION_PROCESSOR === 'true') {
  NotificationProcessor.start();
}