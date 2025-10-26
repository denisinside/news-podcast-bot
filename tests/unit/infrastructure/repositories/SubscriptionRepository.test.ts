import { SubscriptionRepository } from '@infrastructure/repositories/SubscriptionRepository';
import { Subscription } from '@models/Subscription';
import { Types } from 'mongoose';

// Mock the Subscription model
jest.mock('@models/Subscription');

describe('SubscriptionRepository', () => {
  let subscriptionRepository: SubscriptionRepository;
  let mockSubscription: any;

  beforeEach(() => {
    subscriptionRepository = new SubscriptionRepository();
    
    // Create mock subscription instance
    mockSubscription = {
      save: jest.fn(),
      _id: 'test-subscription-id',
      userId: 'test-user-id',
      topicId: new Types.ObjectId(),
      subscribedAt: new Date(),
      isActive: true
    };

    // Mock Subscription constructor and static methods
    (Subscription as any).mockImplementation(() => mockSubscription);
    (Subscription.find as any) = jest.fn();
    (Subscription.findOne as any) = jest.fn();
    (Subscription.findById as any) = jest.fn();
    (Subscription.findOneAndDelete as any) = jest.fn();
    (Subscription.findByIdAndUpdate as any) = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findByUserId', () => {
    it('should find subscriptions by user ID with populated topicId', async () => {
      // Arrange
      const userId = 'test-user-id';
      const subscriptions = [mockSubscription];
      const mockQuery = {
        populate: jest.fn().mockResolvedValue(subscriptions)
      };
      (Subscription.find as any).mockReturnValue(mockQuery);

      // Act
      const result = await subscriptionRepository.findByUserId(userId);

      // Assert
      expect(Subscription.find).toHaveBeenCalledWith({ userId });
      expect(mockQuery.populate).toHaveBeenCalledWith('topicId');
      expect(result).toBe(subscriptions);
    });
  });

  describe('create', () => {
    it('should create new subscription', async () => {
      // Arrange
      const userId = 'test-user-id';
      const topicId = new Types.ObjectId();
      mockSubscription.save.mockResolvedValue(mockSubscription);

      // Act
      const result = await subscriptionRepository.create(userId, topicId);

      // Assert
      expect(Subscription).toHaveBeenCalledWith({ userId, topicId });
      expect(mockSubscription.save).toHaveBeenCalled();
      expect(result).toBe(mockSubscription);
    });
  });

  describe('delete', () => {
    it('should delete subscription', async () => {
      // Arrange
      const userId = 'test-user-id';
      const topicId = new Types.ObjectId();
      (Subscription.findOneAndDelete as any).mockResolvedValue(mockSubscription);

      // Act
      const result = await subscriptionRepository.delete(userId, topicId);

      // Assert
      expect(Subscription.findOneAndDelete).toHaveBeenCalledWith({ userId, topicId });
      expect(result).toBe(true);
    });

    it('should return false when subscription not found', async () => {
      // Arrange
      const userId = 'test-user-id';
      const topicId = new Types.ObjectId();
      (Subscription.findOneAndDelete as any).mockResolvedValue(null);

      // Act
      const result = await subscriptionRepository.delete(userId, topicId);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('exists', () => {
    it('should return true when subscription exists', async () => {
      // Arrange
      const userId = 'test-user-id';
      const topicId = new Types.ObjectId();
      (Subscription.findOne as any).mockResolvedValue(mockSubscription);

      // Act
      const result = await subscriptionRepository.exists(userId, topicId);

      // Assert
      expect(Subscription.findOne).toHaveBeenCalledWith({ userId, topicId });
      expect(result).toBe(true);
    });

    it('should return false when subscription does not exist', async () => {
      // Arrange
      const userId = 'test-user-id';
      const topicId = new Types.ObjectId();
      (Subscription.findOne as any).mockResolvedValue(null);

      // Act
      const result = await subscriptionRepository.exists(userId, topicId);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('findById', () => {
    it('should find subscription by ID with populated topicId', async () => {
      // Arrange
      const id = 'test-subscription-id';
      const mockQuery = {
        populate: jest.fn().mockResolvedValue(mockSubscription)
      };
      (Subscription.findById as any).mockReturnValue(mockQuery);

      // Act
      const result = await subscriptionRepository.findById(id);

      // Assert
      expect(Subscription.findById).toHaveBeenCalledWith(id);
      expect(mockQuery.populate).toHaveBeenCalledWith('topicId');
      expect(result).toBe(mockSubscription);
    });
  });

  describe('findByTopicId', () => {
    it('should find active subscriptions by topic ID', async () => {
      // Arrange
      const topicId = new Types.ObjectId().toHexString(); // Valid ObjectId string
      const subscriptions = [mockSubscription];
      (Subscription.find as any).mockResolvedValue(subscriptions);

      // Act
      const result = await subscriptionRepository.findByTopicId(topicId);

      // Assert
      expect(Subscription.find).toHaveBeenCalledWith({ 
        topicId: new Types.ObjectId(topicId), 
        isActive: true 
      });
      expect(result).toBe(subscriptions);
    });
  });

  describe('findAll', () => {
    it('should return all subscriptions with populated topicId', async () => {
      // Arrange
      const subscriptions = [mockSubscription];
      const mockQuery = {
        populate: jest.fn().mockResolvedValue(subscriptions)
      };
      (Subscription.find as any).mockReturnValue(mockQuery);

      // Act
      const result = await subscriptionRepository.findAll();

      // Assert
      expect(Subscription.find).toHaveBeenCalledWith();
      expect(mockQuery.populate).toHaveBeenCalledWith('topicId');
      expect(result).toBe(subscriptions);
    });
  });

  describe('update', () => {
    it('should update subscription', async () => {
      // Arrange
      const id = 'test-subscription-id';
      const updateData = { isActive: false };
      (Subscription.findByIdAndUpdate as any).mockResolvedValue(mockSubscription);

      // Act
      const result = await subscriptionRepository.update(id, updateData);

      // Assert
      expect(Subscription.findByIdAndUpdate).toHaveBeenCalledWith(id, updateData, { new: true });
      expect(result).toBe(mockSubscription);
    });

    it('should return null when subscription not found', async () => {
      // Arrange
      const id = 'nonexistent-id';
      const updateData = { isActive: false };
      (Subscription.findByIdAndUpdate as any).mockResolvedValue(null);

      // Act
      const result = await subscriptionRepository.update(id, updateData);

      // Assert
      expect(result).toBeNull();
    });
  });
});
