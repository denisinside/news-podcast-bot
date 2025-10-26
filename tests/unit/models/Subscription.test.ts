import { Subscription } from '@models/Subscription';
import { Types } from 'mongoose';

describe('Subscription Model', () => {
  describe('Schema Validation', () => {
    it('should create subscription with valid data', () => {
      // Arrange
      const subscriptionData = {
        userId: 'user123',
        topicId: new Types.ObjectId(),
        subscribedAt: new Date(),
        isActive: true
      };

      // Act
      const subscription = new Subscription(subscriptionData);

      // Assert
      expect(subscription.userId).toBe('user123');
      expect(subscription.topicId).toBeInstanceOf(Types.ObjectId);
      expect(subscription.subscribedAt).toBeInstanceOf(Date);
      expect(subscription.isActive).toBe(true);
    });
  });

  describe('Default Values', () => {
    it('should set default subscribedAt to current date', () => {
      // Arrange
      const subscriptionData = {
        userId: 'user123',
        topicId: new Types.ObjectId()
      };
      const beforeCreation = new Date();

      // Act
      const subscription = new Subscription(subscriptionData);

      // Assert
      expect(subscription.subscribedAt).toBeInstanceOf(Date);
      expect(subscription.subscribedAt.getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime());
    });

    it('should set default isActive to true', () => {
      // Arrange
      const subscriptionData = {
        userId: 'user123',
        topicId: new Types.ObjectId()
      };

      // Act
      const subscription = new Subscription(subscriptionData);

      // Assert
      expect(subscription.isActive).toBe(true);
    });
  });

  describe('Required Fields', () => {
    it('should require userId field', () => {
      // Arrange
      const subscriptionData = {
        topicId: new Types.ObjectId()
      };

      // Act
      const subscription = new Subscription(subscriptionData);

      // Assert
      expect(subscription.userId).toBeUndefined();
    });

    it('should require topicId field', () => {
      // Arrange
      const subscriptionData = {
        userId: 'user123'
      };

      // Act
      const subscription = new Subscription(subscriptionData);

      // Assert
      expect(subscription.topicId).toBeUndefined();
    });
  });

  describe('Data Types', () => {
    it('should accept string for userId', () => {
      // Arrange
      const subscriptionData = {
        userId: 'test-user-id',
        topicId: new Types.ObjectId()
      };

      // Act
      const subscription = new Subscription(subscriptionData);

      // Assert
      expect(typeof subscription.userId).toBe('string');
      expect(subscription.userId).toBe('test-user-id');
    });

    it('should accept ObjectId for topicId', () => {
      // Arrange
      const topicId = new Types.ObjectId();
      const subscriptionData = {
        userId: 'user123',
        topicId
      };

      // Act
      const subscription = new Subscription(subscriptionData);

      // Assert
      expect(subscription.topicId).toBeInstanceOf(Types.ObjectId);
      expect(subscription.topicId.toString()).toBe(topicId.toString());
    });

    it('should accept Date for subscribedAt', () => {
      // Arrange
      const testDate = new Date('2023-01-01');
      const subscriptionData = {
        userId: 'user123',
        topicId: new Types.ObjectId(),
        subscribedAt: testDate
      };

      // Act
      const subscription = new Subscription(subscriptionData);

      // Assert
      expect(subscription.subscribedAt).toBeInstanceOf(Date);
      expect(subscription.subscribedAt).toEqual(testDate);
    });

    it('should accept boolean for isActive', () => {
      // Arrange
      const subscriptionData = {
        userId: 'user123',
        topicId: new Types.ObjectId(),
        isActive: false
      };

      // Act
      const subscription = new Subscription(subscriptionData);

      // Assert
      expect(typeof subscription.isActive).toBe('boolean');
      expect(subscription.isActive).toBe(false);
    });
  });

  describe('Model Methods', () => {
    it('should have save method', () => {
      // Arrange
      const subscriptionData = {
        userId: 'user123',
        topicId: new Types.ObjectId()
      };
      const subscription = new Subscription(subscriptionData);

      // Assert
      expect(typeof subscription.save).toBe('function');
    });

    it('should have toObject method', () => {
      // Arrange
      const subscriptionData = {
        userId: 'user123',
        topicId: new Types.ObjectId()
      };
      const subscription = new Subscription(subscriptionData);

      // Assert
      expect(typeof subscription.toObject).toBe('function');
    });
  });
});
