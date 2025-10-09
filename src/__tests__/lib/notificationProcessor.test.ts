import { NotificationProcessor } from '@/lib/notificationProcessor';
import { NotificationService } from '@/lib/notifications';

// Mock NotificationService
jest.mock('@/lib/notifications');

const mockNotificationService = NotificationService as jest.Mocked<typeof NotificationService>;

describe('NotificationProcessor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
    jest.useFakeTimers();
    
    // Stop any running processor
    NotificationProcessor.stop();
  });

  afterEach(() => {
    NotificationProcessor.stop();
    jest.useRealTimers();
  });

  describe('start', () => {
    it('should start the processor successfully', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      NotificationProcessor.start(1000);
      
      expect(consoleSpy).toHaveBeenCalledWith('Starting notification processor...');
      expect(NotificationProcessor.getStatus().isRunning).toBe(true);
      expect(NotificationProcessor.getStatus().intervalId).not.toBeNull();
      
      consoleSpy.mockRestore();
    });

    it('should not start if already running', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      NotificationProcessor.start(1000);
      NotificationProcessor.start(1000);
      
      expect(consoleSpy).toHaveBeenCalledWith('Starting notification processor...');
      expect(consoleSpy).toHaveBeenCalledWith('Notification processor is already running');
      
      consoleSpy.mockRestore();
    });

    it('should process queue immediately on start', () => {
      mockNotificationService.processQueue.mockResolvedValue();
      
      NotificationProcessor.start(1000);
      
      expect(mockNotificationService.processQueue).toHaveBeenCalledTimes(1);
    });

    it('should process queue at specified intervals', () => {
      mockNotificationService.processQueue.mockResolvedValue();
      
      NotificationProcessor.start(1000);
      
      // Initial call
      expect(mockNotificationService.processQueue).toHaveBeenCalledTimes(1);
      
      // Advance timer by 1 second
      jest.advanceTimersByTime(1000);
      expect(mockNotificationService.processQueue).toHaveBeenCalledTimes(2);
      
      // Advance timer by another second
      jest.advanceTimersByTime(1000);
      expect(mockNotificationService.processQueue).toHaveBeenCalledTimes(3);
    });

    it('should use default interval when none specified', () => {
      mockNotificationService.processQueue.mockResolvedValue();
      
      NotificationProcessor.start();
      
      // Advance timer by default interval (5000ms)
      jest.advanceTimersByTime(5000);
      expect(mockNotificationService.processQueue).toHaveBeenCalledTimes(2);
    });
  });

  describe('stop', () => {
    it('should stop the processor successfully', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      NotificationProcessor.start(1000);
      NotificationProcessor.stop();
      
      expect(consoleSpy).toHaveBeenCalledWith('Stopping notification processor...');
      expect(NotificationProcessor.getStatus().isRunning).toBe(false);
      expect(NotificationProcessor.getStatus().intervalId).toBeNull();
      
      consoleSpy.mockRestore();
    });

    it('should not stop if not running', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      NotificationProcessor.stop();
      
      expect(consoleSpy).toHaveBeenCalledWith('Notification processor is not running');
      
      consoleSpy.mockRestore();
    });

    it('should clear the interval when stopping', () => {
      mockNotificationService.processQueue.mockResolvedValue();
      
      NotificationProcessor.start(1000);
      
      // Verify it's processing
      jest.advanceTimersByTime(1000);
      expect(mockNotificationService.processQueue).toHaveBeenCalledTimes(2);
      
      NotificationProcessor.stop();
      
      // Advance timer - should not process anymore
      jest.advanceTimersByTime(1000);
      expect(mockNotificationService.processQueue).toHaveBeenCalledTimes(2);
    });
  });

  describe('processQueue', () => {
    it('should handle processing errors gracefully', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      const error = new Error('Processing failed');
      
      mockNotificationService.processQueue.mockRejectedValue(error);
      
      NotificationProcessor.start(1000);
      
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error in notification processor:', error);
      
      consoleErrorSpy.mockRestore();
    });

    it('should not process when processor is stopped', () => {
      mockNotificationService.processQueue.mockResolvedValue();
      
      NotificationProcessor.start(1000);
      NotificationProcessor.stop();
      
      // Clear previous calls
      mockNotificationService.processQueue.mockClear();
      
      // Advance timer - should not process
      jest.advanceTimersByTime(1000);
      expect(mockNotificationService.processQueue).not.toHaveBeenCalled();
    });
  });

  describe('getStatus', () => {
    it('should return correct status when not running', () => {
      const status = NotificationProcessor.getStatus();
      
      expect(status.isRunning).toBe(false);
      expect(status.intervalId).toBeNull();
    });

    it('should return correct status when running', () => {
      NotificationProcessor.start(1000);
      
      const status = NotificationProcessor.getStatus();
      
      expect(status.isRunning).toBe(true);
      expect(status.intervalId).not.toBeNull();
    });
  });

  describe('Auto-start in production', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      jest.resetModules();
      process.env = { ...originalEnv };
    });

    afterEach(() => {
      process.env = originalEnv;
    });

    it('should auto-start in production when enabled', () => {
      process.env.NODE_ENV = 'production';
      process.env.AUTO_START_NOTIFICATION_PROCESSOR = 'true';
      
      const startSpy = jest.spyOn(NotificationProcessor, 'start').mockImplementation();
      
      // Re-import to trigger auto-start logic
      jest.isolateModules(() => {
        require('@/lib/notificationProcessor');
      });
      
      expect(startSpy).toHaveBeenCalled();
      
      startSpy.mockRestore();
    });

    it('should not auto-start in development', () => {
      process.env.NODE_ENV = 'development';
      process.env.AUTO_START_NOTIFICATION_PROCESSOR = 'true';
      
      const startSpy = jest.spyOn(NotificationProcessor, 'start').mockImplementation();
      
      // Re-import to trigger auto-start logic
      jest.isolateModules(() => {
        require('@/lib/notificationProcessor');
      });
      
      expect(startSpy).not.toHaveBeenCalled();
      
      startSpy.mockRestore();
    });

    it('should not auto-start when disabled', () => {
      process.env.NODE_ENV = 'production';
      process.env.AUTO_START_NOTIFICATION_PROCESSOR = 'false';
      
      const startSpy = jest.spyOn(NotificationProcessor, 'start').mockImplementation();
      
      // Re-import to trigger auto-start logic
      jest.isolateModules(() => {
        require('@/lib/notificationProcessor');
      });
      
      expect(startSpy).not.toHaveBeenCalled();
      
      startSpy.mockRestore();
    });
  });
});