import { SubscriptionService } from '@application/services/SubscriptionService';
import { ISubscriptionRepository } from '@infrastructure/repositories/ISubscriptionRepository';
import { ISubscription } from '@models/Subscription';
import { Types } from 'mongoose';

describe('SubscriptionService', () => {
  let subscriptionService: SubscriptionService;
  let mockSubscriptionRepository: jest.Mocked<ISubscriptionRepository>;

  beforeEach(() => {
    mockSubscriptionRepository = {
      findByUserId: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      exists: jest.fn(),
      findByTopicId: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
    };

    subscriptionService = new SubscriptionService(mockSubscriptionRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('subscribe', () => {
    it('should create subscription when user is not subscribed', async () => {
      // Arrange
      const userId = 'user123';
      const topicId = new Types.ObjectId();
      mockSubscriptionRepository.exists.mockResolvedValue(false);
      mockSubscriptionRepository.create.mockResolvedValue({} as ISubscription);

      // Mock console.log to avoid test output pollution
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      // Act
      await subscriptionService.subscribe(userId, topicId);

      // Assert
      expect(mockSubscriptionRepository.exists).toHaveBeenCalledWith(userId, topicId);
      expect(mockSubscriptionRepository.create).toHaveBeenCalledWith(userId, topicId);
      expect(consoleSpy).toHaveBeenCalledWith(`User ${userId} subscribed to topic ${topicId}`);

      // Cleanup
      consoleSpy.mockRestore();
    });

    it('should not create subscription when user is already subscribed', async () => {
      // Arrange
      const userId = 'user123';
      const topicId = new Types.ObjectId();
      mockSubscriptionRepository.exists.mockResolvedValue(true);

      // Mock console.log to avoid test output pollution
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      // Act
      await subscriptionService.subscribe(userId, topicId);

      // Assert
      expect(mockSubscriptionRepository.exists).toHaveBeenCalledWith(userId, topicId);
      expect(mockSubscriptionRepository.create).not.toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith(`User ${userId} already subscribed to topic ${topicId}`);

      // Cleanup
      consoleSpy.mockRestore();
    });
  });

  describe('unsubscribe', () => {
    it('should delete subscription when user is subscribed', async () => {
      // Arrange
      const userId = 'user123';
      const topicId = new Types.ObjectId();
      mockSubscriptionRepository.delete.mockResolvedValue(true);

      // Mock console.log to avoid test output pollution
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      // Act
      await subscriptionService.unsubscribe(userId, topicId);

      // Assert
      expect(mockSubscriptionRepository.delete).toHaveBeenCalledWith(userId, topicId);
      expect(consoleSpy).toHaveBeenCalledWith(`User ${userId} unsubscribed from topic ${topicId}`);

      // Cleanup
      consoleSpy.mockRestore();
    });

    it('should handle case when user is not subscribed', async () => {
      // Arrange
      const userId = 'user123';
      const topicId = new Types.ObjectId();
      mockSubscriptionRepository.delete.mockResolvedValue(false);

      // Mock console.log to avoid test output pollution
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      // Act
      await subscriptionService.unsubscribe(userId, topicId);

      // Assert
      expect(mockSubscriptionRepository.delete).toHaveBeenCalledWith(userId, topicId);
      expect(consoleSpy).toHaveBeenCalledWith(`User ${userId} was not subscribed to topic ${topicId}`);

      // Cleanup
      consoleSpy.mockRestore();
    });
  });

  describe('getUserSubscriptions', () => {
    it('should return user subscriptions', async () => {
      // Arrange
      const userId = 'user123';
      const subscriptions: ISubscription[] = [
        {
          _id: 'sub1',
          userId,
          topicId: new Types.ObjectId(),
          subscribedAt: new Date(),
          isActive: true
        } as ISubscription,
        {
          _id: 'sub2',
          userId,
          topicId: new Types.ObjectId(),
          subscribedAt: new Date(),
          isActive: true
        } as ISubscription
      ];

      mockSubscriptionRepository.findByUserId.mockResolvedValue(subscriptions);

      // Act
      const result = await subscriptionService.getUserSubscriptions(userId);

      // Assert
      expect(mockSubscriptionRepository.findByUserId).toHaveBeenCalledWith(userId);
      expect(result).toBe(subscriptions);
    });

    it('should return empty array when user has no subscriptions', async () => {
      // Arrange
      const userId = 'user123';
      mockSubscriptionRepository.findByUserId.mockResolvedValue([]);

      // Act
      const result = await subscriptionService.getUserSubscriptions(userId);

      // Assert
      expect(mockSubscriptionRepository.findByUserId).toHaveBeenCalledWith(userId);
      expect(result).toEqual([]);
    });
  });
});
