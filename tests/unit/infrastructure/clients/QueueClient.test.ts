import { QueueClient } from '@infrastructure/clients/QueueClient';
import { Types } from 'mongoose';

describe('QueueClient', () => {
  let queueClient: QueueClient;

  beforeEach(() => {
    queueClient = new QueueClient();
  });

  describe('constructor', () => {
    it('should create instance successfully', () => {
      // Act
      const client = new QueueClient();

      // Assert
      expect(client).toBeInstanceOf(QueueClient);
    });
  });

  describe('addNewsFetchJob', () => {
    it('should throw not implemented error', () => {
      // Act & Assert
      expect(() => queueClient.addNewsFetchJob()).toThrow('Method not implemented.');
    });
  });

  describe('addPodcastJob', () => {
    it('should throw not implemented error', () => {
      // Arrange
      const data = { userId: new Types.ObjectId() };

      // Act & Assert
      expect(() => queueClient.addPodcastJob(data)).toThrow('Method not implemented.');
    });

    it('should accept valid userId ObjectId', () => {
      // Arrange
      const userId = new Types.ObjectId();
      const data = { userId };

      // Act & Assert
      expect(() => queueClient.addPodcastJob(data)).toThrow('Method not implemented.');
    });
  });

  describe('interface compliance', () => {
    it('should implement IQueueClient interface', () => {
      // Assert
      expect(typeof queueClient.addNewsFetchJob).toBe('function');
      expect(typeof queueClient.addPodcastJob).toBe('function');
    });
  });
});