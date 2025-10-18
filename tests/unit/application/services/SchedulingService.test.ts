import { SchedulingService } from '@application/services/SchedulingService';
import { IUserRepository } from '@infrastructure/repositories/IUserRepository';
import { ISubscriptionRepository } from '@infrastructure/repositories/ISubscriptionRepository';
import { INewsFinderService } from '@application/interfaces/INewsFinderService';

describe('SchedulingService', () => {
  let schedulingService: SchedulingService;
  let mockUserRepository: jest.Mocked<IUserRepository>;
  let mockSubscriptionRepository: jest.Mocked<ISubscriptionRepository>;
  let mockQueueClient: any;
  let mockNewsFinderService: jest.Mocked<INewsFinderService>;

  beforeEach(() => {
    mockUserRepository = {
      findById: jest.fn(),
      findByTelegramId: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findAll: jest.fn(),
      findByRole: jest.fn(),
      blockUser: jest.fn(),
      unblockUser: jest.fn(),
      countActiveUsers: jest.fn(),
      countNewUsers: jest.fn(),
    };

    mockSubscriptionRepository = {
      findByUserId: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      exists: jest.fn(),
      findByTopicId: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
    };

    mockQueueClient = {
      addNewsFetchJob: jest.fn(),
      addPodcastJob: jest.fn(),
    };

    mockNewsFinderService = {
      fetchAndSaveAllTopics: jest.fn(),
      fetchAndSaveArticlesForTopic: jest.fn(),
      getArticlesByKeywords: jest.fn(),
      getArticlesByDateRange: jest.fn(),
      getArticlesBySource: jest.fn(),
      cleanupOldArticles: jest.fn(),
      initAllStrategies: jest.fn(),
      setNotificationService: jest.fn(),
      getArticlesForUser: jest.fn(),
    };

    schedulingService = new SchedulingService(
      mockUserRepository,
      mockSubscriptionRepository,
      mockQueueClient,
      mockNewsFinderService
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create instance with dependencies', () => {
      // Act
      const service = new SchedulingService(
        mockUserRepository,
        mockSubscriptionRepository,
        mockQueueClient,
        mockNewsFinderService
      );

      // Assert
      expect(service).toBeInstanceOf(SchedulingService);
    });
  });

  describe('scheduleNewsFetching', () => {
    it('should call newsFinderService.fetchAndSaveAllTopics', async () => {
      // Arrange
      mockNewsFinderService.fetchAndSaveAllTopics.mockResolvedValue();

      // Act
      await schedulingService.scheduleNewsFetching();

      // Assert
      expect(mockNewsFinderService.fetchAndSaveAllTopics).toHaveBeenCalledTimes(1);
    });

    it('should handle errors from newsFinderService', async () => {
      // Arrange
      const error = new Error('News fetching failed');
      mockNewsFinderService.fetchAndSaveAllTopics.mockRejectedValue(error);

      // Act & Assert
      await expect(schedulingService.scheduleNewsFetching()).rejects.toThrow('News fetching failed');
    });
  });

  describe('scheduleDailyPodcasts', () => {
    it('should call newsFinderService.fetchAndSaveAllTopics', async () => {
      // Arrange
      mockNewsFinderService.fetchAndSaveAllTopics.mockResolvedValue();

      // Act
      await schedulingService.scheduleDailyPodcasts();

      // Assert
      expect(mockNewsFinderService.fetchAndSaveAllTopics).toHaveBeenCalledTimes(1);
    });

    it('should handle errors from newsFinderService', async () => {
      // Arrange
      const error = new Error('Podcast scheduling failed');
      mockNewsFinderService.fetchAndSaveAllTopics.mockRejectedValue(error);

      // Act & Assert
      await expect(schedulingService.scheduleDailyPodcasts()).rejects.toThrow('Podcast scheduling failed');
    });
  });

  describe('dependency injection', () => {
    it('should have access to userRepository', () => {
      // Assert
      expect((schedulingService as any).userRepository).toBe(mockUserRepository);
    });

    it('should have access to subscriptionRepository', () => {
      // Assert
      expect((schedulingService as any).subscriptionRepository).toBe(mockSubscriptionRepository);
    });

    it('should have access to queueClient', () => {
      // Assert
      expect((schedulingService as any).queueClient).toBe(mockQueueClient);
    });

    it('should have access to newsFinderService', () => {
      // Assert
      expect((schedulingService as any).newsFinderService).toBe(mockNewsFinderService);
    });
  });
});
