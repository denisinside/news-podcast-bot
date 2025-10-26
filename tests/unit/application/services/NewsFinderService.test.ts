import { NewsFinderService } from '@application/services/NewsFinderService';
import { IArticleRepository } from '@infrastructure/repositories/IArticleRepository';
import { ITopicRepository } from '@infrastructure/repositories/ITopicRepository';
import { INewsSourceStrategy } from '@infrastructure/strategies/INewsSourceStrategy';
import { INotificationService } from '@application/interfaces/INotificationService';
import { IUserSettingsService } from '@application/interfaces/IUserSettingsService';
import { IArticle } from '@models/Article';
import { ITopic } from '@models/Topic';
import { RssSource } from '@infrastructure/strategies/RssSource';

// Mock the RssSource class
jest.mock('@infrastructure/strategies/RssSource');

describe('NewsFinderService', () => {
  let newsFinderService: NewsFinderService;
  let mockArticleRepository: jest.Mocked<IArticleRepository>;
  let mockTopicRepository: jest.Mocked<ITopicRepository>;
  let mockUserSettingsService: jest.Mocked<IUserSettingsService>;
  let mockNotificationService: jest.Mocked<INotificationService>;
  let mockStrategy: jest.Mocked<INewsSourceStrategy>;
  let mockTopic: ITopic;
  let mockArticle: IArticle;

  beforeEach(() => {
    mockArticleRepository = {
      create: jest.fn(),
      findByUrl: jest.fn(),
      findByTopicIdsSince: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      bulkInsert: jest.fn(),
      findByDateRange: jest.fn(),
      findBySource: jest.fn(),
      findByUserId: jest.fn(),
      cleanupOldArticles: jest.fn(),
    };

    mockTopicRepository = {
      findAll: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findBySourceUrl: jest.fn(),
      findByName: jest.fn(),
    };

    mockUserSettingsService = {
      getUserSettings: jest.fn(),
      createDefaultSettings: jest.fn(),
      updateNewsFrequency: jest.fn(),
      updateAudioPodcasts: jest.fn(),
      getAllUserSettings: jest.fn(),
    };

    mockNotificationService = {
      sendNewsToSubscribers: jest.fn(),
      sendPodcastToUser: jest.fn(),
      sendBulkMessages: jest.fn(),
      sendMessage: jest.fn(),
      sendMessageWithMedia: jest.fn(),
      messageTemplateService: {} as any,
      podcastService: {} as any,
    };

    mockStrategy = {
      sourceTopic: {} as ITopic,
      isActive: jest.fn(),
      fetch: jest.fn(),
      getSourceName: jest.fn(),
    };

    mockTopic = {
      _id: 'topic-id',
      name: 'Technology',
      sourceUrl: 'http://tech.com/rss'
    } as ITopic;

    mockArticle = {
      _id: 'article-id',
      title: 'Test Article',
      url: 'http://tech.com/article',
      content: 'Test content',
      publicationDate: new Date(),
      source: 'Tech Source',
      topicId: mockTopic._id
    } as IArticle;

    // Mock the initAllStrategies method to avoid constructor issues
    jest.spyOn(NewsFinderService.prototype as any, 'initAllStrategies').mockResolvedValue(undefined);
    
    newsFinderService = new NewsFinderService(mockArticleRepository, mockTopicRepository, mockUserSettingsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create instance with dependencies', () => {
      // Act
      const service = new NewsFinderService(mockArticleRepository, mockTopicRepository, mockUserSettingsService);

      // Assert
      expect(service).toBeInstanceOf(NewsFinderService);
    });
  });

  describe('setNotificationService', () => {
    it('should set notification service', () => {
      // Act
      newsFinderService.setNotificationService(mockNotificationService);

      // Assert
      expect((newsFinderService as any).notificationService).toBe(mockNotificationService);
    });
  });

  describe('setStrategy', () => {
    it('should set strategy for source', () => {
      // Arrange
      const sourceId = 'tech-source';

      // Act
      newsFinderService.setStrategy(sourceId, mockStrategy);

      // Assert
      expect((newsFinderService as any).strategies.get(sourceId)).toBe(mockStrategy);
    });
  });

  describe('fetchAndSaveAllTopics', () => {
    it('should fetch and save articles for all topics', async () => {
      // Arrange
      const topics = [mockTopic];
      mockTopicRepository.findAll.mockResolvedValue(topics);
      
      // Mock the private method
      const fetchAndSaveArticlesForTopicSpy = jest.spyOn(newsFinderService as any, 'fetchAndSaveArticlesForTopic')
        .mockResolvedValue(undefined);

      // Mock console.log to avoid test output pollution
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      // Act
      await newsFinderService.fetchAndSaveAllTopics();

      // Assert
      expect(mockTopicRepository.findAll).toHaveBeenCalled();
      expect(fetchAndSaveArticlesForTopicSpy).toHaveBeenCalledWith(mockTopic);
      expect(consoleSpy).toHaveBeenCalledWith('Starting news fetching process for all topics...');
      expect(consoleSpy).toHaveBeenCalledWith('News fetching process completed for all topics');

      // Cleanup
      consoleSpy.mockRestore();
      fetchAndSaveArticlesForTopicSpy.mockRestore();
    });

    it('should handle empty topics list', async () => {
      // Arrange
      mockTopicRepository.findAll.mockResolvedValue([]);

      // Mock console.log to avoid test output pollution
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      // Act
      await newsFinderService.fetchAndSaveAllTopics();

      // Assert
      expect(mockTopicRepository.findAll).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith('No topics found to fetch articles for');

      // Cleanup
      consoleSpy.mockRestore();
    });

    it('should handle errors', async () => {
      // Arrange
      const error = new Error('Database error');
      mockTopicRepository.findAll.mockRejectedValue(error);

      // Mock console.error to avoid test output pollution
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      // Act & Assert
      await expect(newsFinderService.fetchAndSaveAllTopics()).rejects.toThrow(
        'Failed to fetch and save articles for all topics'
      );

      expect(consoleSpy).toHaveBeenCalledWith('Error in NewsFinderService.fetchAndSaveAllTopics:', error);

      // Cleanup
      consoleSpy.mockRestore();
    });
  });

  describe('fetchAndSaveArticlesForTopic', () => {
    beforeEach(() => {
      newsFinderService.setStrategy('tech-source', mockStrategy);
    });

    it('should fetch and save articles for topic', async () => {
      // Arrange
      const articles = [mockArticle];
      mockStrategy.isActive.mockReturnValue(true);
      mockStrategy.fetch.mockResolvedValue(articles);
      mockArticleRepository.bulkInsert.mockResolvedValue(articles);

      // Mock console.log to avoid test output pollution
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      // Act
      await newsFinderService.fetchAndSaveArticlesForTopic(mockTopic);

      // Assert
      expect(mockStrategy.isActive).toHaveBeenCalled();
      expect(mockStrategy.fetch).toHaveBeenCalledWith(mockTopic.sourceUrl);
      expect(mockArticleRepository.bulkInsert).toHaveBeenCalledWith(articles);
      expect(consoleSpy).toHaveBeenCalledWith(`Saved ${articles.length} new articles for topic: ${mockTopic.name}`);

      // Cleanup
      consoleSpy.mockRestore();
    });

    it('should handle no strategy found', async () => {
      // Arrange
      const mockTopic = { _id: 'topic1', id: 'topic1', name: 'Technology', sourceUrl: 'http://tech.com' } as ITopic;
      // Don't set any strategy for this topic

      // Mock console.log to avoid test output pollution
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      // Act
      await newsFinderService.fetchAndSaveArticlesForTopic(mockTopic);

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith(`No strategy found for topic: ${mockTopic.name}`);

      // Cleanup
      consoleSpy.mockRestore();
    });

    it('should handle inactive strategy', async () => {
      // Arrange
      mockStrategy.isActive.mockReturnValue(false);

      // Mock console.log to avoid test output pollution
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      // Act
      await newsFinderService.fetchAndSaveArticlesForTopic(mockTopic);

      // Assert
      expect(mockStrategy.isActive).toHaveBeenCalled();
      expect(mockStrategy.fetch).not.toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith(`Strategy for topic ${mockTopic.name} is inactive`);

      // Cleanup
      consoleSpy.mockRestore();
    });

    it('should handle no articles found', async () => {
      // Arrange
      mockStrategy.isActive.mockReturnValue(true);
      mockStrategy.fetch.mockResolvedValue([]);

      // Mock console.log to avoid test output pollution
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      // Act
      await newsFinderService.fetchAndSaveArticlesForTopic(mockTopic);

      // Assert
      expect(mockStrategy.fetch).toHaveBeenCalledWith(mockTopic.sourceUrl);
      expect(mockArticleRepository.bulkInsert).not.toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith(`No new articles found for topic: ${mockTopic.name}`);

      // Cleanup
      consoleSpy.mockRestore();
    });
  });

  describe('getArticlesByKeywords', () => {
    it('should return articles matching keywords', async () => {
      // Arrange
      const keywords = ['technology', 'AI'];
      const articles = [
        { ...mockArticle, title: 'AI Technology News', content: 'Latest AI developments' } as IArticle,
        { ...mockArticle, title: 'Sports News', content: 'Football match results' } as IArticle
      ];
      mockArticleRepository.findAll.mockResolvedValue(articles);

      // Act
      const result = await newsFinderService.getArticlesByKeywords(keywords);

      // Assert
      expect(mockArticleRepository.findAll).toHaveBeenCalled();
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('AI Technology News');
    });

    it('should handle errors and return empty array', async () => {
      // Arrange
      const keywords = ['technology'];
      const error = new Error('Database error');
      mockArticleRepository.findAll.mockRejectedValue(error);

      // Mock console.error to avoid test output pollution
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      // Act
      const result = await newsFinderService.getArticlesByKeywords(keywords);

      // Assert
      expect(result).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith('Error getting articles by keywords:', error);

      // Cleanup
      consoleSpy.mockRestore();
    });
  });

  describe('getArticlesForUser', () => {
    it('should return articles for user with HOURLY frequency', async () => {
      // Arrange
      const userId = '123';
      const userSettings = {
        userId: 123,
        newsFrequency: 'hourly' as any,
        enableAudioPodcasts: false
      };
      const articles = [mockArticle];
      
      mockUserSettingsService.getUserSettings.mockResolvedValue(userSettings as any);
      mockArticleRepository.findByUserId.mockResolvedValue(articles);

      // Act
      const result = await newsFinderService.getArticlesForUser(userId);

      // Assert
      expect(mockUserSettingsService.getUserSettings).toHaveBeenCalledWith(123);
      expect(mockArticleRepository.findByUserId).toHaveBeenCalledWith(
        userId, 
        expect.any(Date), // previousSendTime
        expect.any(Date)  // untilDate
      );
      expect(result).toBe(articles);
    });

    it('should return empty array when user settings not found', async () => {
      // Arrange
      const userId = '123';
      mockUserSettingsService.getUserSettings.mockResolvedValue(null);

      // Act
      const result = await newsFinderService.getArticlesForUser(userId);

      // Assert
      expect(result).toEqual([]);
      expect(mockArticleRepository.findByUserId).not.toHaveBeenCalled();
    });

    it('should return empty array when news is disabled', async () => {
      // Arrange
      const userId = '123';
      const userSettings = {
        userId: 123,
        newsFrequency: 'disabled' as any,
        enableAudioPodcasts: false
      };
      
      mockUserSettingsService.getUserSettings.mockResolvedValue(userSettings as any);

      // Act
      const result = await newsFinderService.getArticlesForUser(userId);

      // Assert
      expect(result).toEqual([]);
      expect(mockArticleRepository.findByUserId).not.toHaveBeenCalled();
    });
  });

  describe('getArticlesByDateRange', () => {
    it('should return articles in date range', async () => {
      // Arrange
      const startDate = new Date('2023-01-01');
      const endDate = new Date('2023-12-31');
      const articles = [mockArticle];
      mockArticleRepository.findByDateRange.mockResolvedValue(articles);

      // Act
      const result = await newsFinderService.getArticlesByDateRange(startDate, endDate);

      // Assert
      expect(mockArticleRepository.findByDateRange).toHaveBeenCalledWith(startDate, endDate);
      expect(result).toBe(articles);
    });
  });

  describe('getArticlesBySource', () => {
    it('should return articles by source', async () => {
      // Arrange
      const source = 'Tech Source';
      const articles = [mockArticle];
      mockArticleRepository.findBySource.mockResolvedValue(articles);

      // Act
      const result = await newsFinderService.getArticlesBySource(source);

      // Assert
      expect(mockArticleRepository.findBySource).toHaveBeenCalledWith(source);
      expect(result).toBe(articles);
    });
  });

  describe('cleanupOldArticles', () => {
    it('should cleanup old articles', async () => {
      // Arrange
      const daysOld = 30;
      const deletedCount = 5;
      mockArticleRepository.cleanupOldArticles.mockResolvedValue(deletedCount);

      // Act
      const result = await newsFinderService.cleanupOldArticles(daysOld);

      // Assert
      expect(mockArticleRepository.cleanupOldArticles).toHaveBeenCalledWith(daysOld);
      expect(result).toBe(deletedCount);
    });

    it('should use default 30 days when not specified', async () => {
      // Arrange
      const deletedCount = 3;
      mockArticleRepository.cleanupOldArticles.mockResolvedValue(deletedCount);

      // Act
      const result = await newsFinderService.cleanupOldArticles();

      // Assert
      expect(mockArticleRepository.cleanupOldArticles).toHaveBeenCalledWith(30);
      expect(result).toBe(deletedCount);
    });
  });


  describe('addNewsSource', () => {
    it('should add news source strategy', () => {
      // Arrange
      const source = { id: 'source-id' } as any;

      // Act
      newsFinderService.addNewsSource(source, mockStrategy);

      // Assert
      expect((newsFinderService as any).strategies.get('source-id')).toBe(mockStrategy);
    });
  });

  describe('removeNewsSource', () => {
    it('should remove news source strategy', () => {
      // Arrange
      const sourceId = 'source-id';
      (newsFinderService as any).strategies.set(sourceId, mockStrategy);

      // Act
      newsFinderService.removeNewsSource(sourceId);

      // Assert
      expect((newsFinderService as any).strategies.has(sourceId)).toBe(false);
    });
  });

  describe('getActiveSources', () => {
    it('should return active source IDs', () => {
      // Arrange
      const inactiveStrategy = { ...mockStrategy, isActive: jest.fn().mockReturnValue(false) };
      const activeStrategy = { ...mockStrategy, isActive: jest.fn().mockReturnValue(true) };
      
      (newsFinderService as any).strategies.set('inactive-source', inactiveStrategy);
      (newsFinderService as any).strategies.set('active-source', activeStrategy);

      // Act
      const result = newsFinderService.getActiveSources();

      // Assert
      expect(result).toEqual(['active-source']);
    });
  });
});
