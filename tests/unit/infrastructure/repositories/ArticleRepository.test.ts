import { ArticleRepository } from '@infrastructure/repositories/ArticleRepository';
import { Article } from '@models/Article';
import { Types } from 'mongoose';

// Mock the Article model
jest.mock('@models/Article');

describe('ArticleRepository', () => {
  let articleRepository: ArticleRepository;
  let mockArticle: any;

  beforeEach(() => {
    articleRepository = new ArticleRepository();
    
    // Create mock article instance
    mockArticle = {
      save: jest.fn(),
      _id: 'test-article-id',
      title: 'Test Article',
      url: 'http://test.com/article',
      content: 'Test content',
      publicationDate: new Date(),
      source: 'Test Source',
      topicId: new Types.ObjectId()
    };

    // Mock Article constructor and static methods
    (Article as any).mockImplementation(() => mockArticle);
    (Article.findOne as any) = jest.fn();
    (Article.find as any) = jest.fn();
    (Article.findById as any) = jest.fn();
    (Article.findByIdAndUpdate as any) = jest.fn();
    (Article.findByIdAndDelete as any) = jest.fn();
    (Article.insertMany as any) = jest.fn();
    (Article.deleteMany as any) = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create new article', async () => {
      // Arrange
      const articleData = {
        title: 'Test Article',
        url: 'http://test.com/article',
        content: 'Test content',
        publicationDate: new Date(),
        source: 'Test Source',
        topicId: new Types.ObjectId()
      };
      mockArticle.save.mockResolvedValue(mockArticle);

      // Act
      const result = await articleRepository.create(articleData);

      // Assert
      expect(Article).toHaveBeenCalledWith(articleData);
      expect(mockArticle.save).toHaveBeenCalled();
      expect(result).toBe(mockArticle);
    });
  });

  describe('findByUrl', () => {
    it('should find article by URL', async () => {
      // Arrange
      const url = 'http://test.com/article';
      (Article.findOne as any).mockResolvedValue(mockArticle);

      // Act
      const result = await articleRepository.findByUrl(url);

      // Assert
      expect(Article.findOne).toHaveBeenCalledWith({ url });
      expect(result).toBe(mockArticle);
    });

    it('should return null when article not found', async () => {
      // Arrange
      const url = 'http://nonexistent.com/article';
      (Article.findOne as any).mockResolvedValue(null);

      // Act
      const result = await articleRepository.findByUrl(url);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('findByTopicIdsSince', () => {
    it('should find articles by topic IDs since date', async () => {
      // Arrange
      const topicIds = [new Types.ObjectId(), new Types.ObjectId()];
      const date = new Date('2023-01-01');
      const articles = [mockArticle];
      
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue(articles)
      };
      (Article.find as any).mockReturnValue(mockQuery);

      // Act
      const result = await articleRepository.findByTopicIdsSince(topicIds, date);

      // Assert
      expect(Article.find).toHaveBeenCalledWith({
        topicId: { $in: topicIds },
        publicationDate: { $gte: date }
      });
      expect(mockQuery.populate).toHaveBeenCalledWith('topicId');
      expect(mockQuery.sort).toHaveBeenCalledWith({ publicationDate: -1 });
      expect(result).toBe(articles);
    });
  });

  describe('findById', () => {
    it('should find article by ID', async () => {
      // Arrange
      const id = 'test-article-id';
      (Article.findById as any).mockResolvedValue(mockArticle);

      // Act
      const result = await articleRepository.findById(id);

      // Assert
      expect(Article.findById).toHaveBeenCalledWith(id);
      expect(result).toBe(mockArticle);
    });
  });

  describe('findAll', () => {
    it('should return all articles', async () => {
      // Arrange
      const articles = [mockArticle];
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue(articles)
      };
      (Article.find as any).mockReturnValue(mockQuery);

      // Act
      const result = await articleRepository.findAll();

      // Assert
      expect(Article.find).toHaveBeenCalledWith();
      expect(mockQuery.populate).toHaveBeenCalledWith('topicId');
      expect(mockQuery.sort).toHaveBeenCalledWith({ publicationDate: -1 });
      expect(result).toBe(articles);
    });
  });

  describe('update', () => {
    it('should update article', async () => {
      // Arrange
      const id = 'test-article-id';
      const updateData = { title: 'Updated Title' };
      (Article.findByIdAndUpdate as any).mockResolvedValue(mockArticle);

      // Act
      const result = await articleRepository.update(id, updateData);

      // Assert
      expect(Article.findByIdAndUpdate).toHaveBeenCalledWith(id, updateData, { new: true });
      expect(result).toBe(mockArticle);
    });
  });

  describe('delete', () => {
    it('should delete article', async () => {
      // Arrange
      const id = 'test-article-id';
      (Article.findByIdAndDelete as any).mockResolvedValue(mockArticle);

      // Act
      const result = await articleRepository.delete(id);

      // Assert
      expect(Article.findByIdAndDelete).toHaveBeenCalledWith(id);
      expect(result).toBe(true);
    });

    it('should return false when article not found', async () => {
      // Arrange
      const id = 'nonexistent-id';
      (Article.findByIdAndDelete as any).mockResolvedValue(null);

      // Act
      const result = await articleRepository.delete(id);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('bulkInsert', () => {
    it('should insert new articles', async () => {
      // Arrange
      const articles = [
        { url: 'http://test.com/1', title: 'Article 1' },
        { url: 'http://test.com/2', title: 'Article 2' }
      ];
      const mockQuery = {
        distinct: jest.fn().mockResolvedValue([])
      };
      (Article.find as any).mockReturnValue(mockQuery);
      (Article.insertMany as any).mockResolvedValue(articles);

      // Act
      const result = await articleRepository.bulkInsert(articles);

      // Assert
      expect(Article.insertMany).toHaveBeenCalledWith(articles);
      expect(result).toBe(articles);
    });

    it('should filter out existing articles', async () => {
      // Arrange
      const articles = [
        { url: 'http://test.com/1', title: 'Article 1' },
        { url: 'http://test.com/2', title: 'Article 2' }
      ];
      const existingUrls = ['http://test.com/1'];
      const mockQuery = {
        distinct: jest.fn().mockResolvedValue(existingUrls)
      };
      (Article.find as any).mockReturnValue(mockQuery);
      (Article.insertMany as any).mockResolvedValue([articles[1]]);

      // Act
      const result = await articleRepository.bulkInsert(articles);

      // Assert
      expect(Article.insertMany).toHaveBeenCalledWith([articles[1]]);
      expect(result).toEqual([articles[1]]);
    });
  });

  describe('findByDateRange', () => {
    it('should find articles by date range', async () => {
      // Arrange
      const startDate = new Date('2023-01-01');
      const endDate = new Date('2023-12-31');
      const articles = [mockArticle];
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue(articles)
      };
      (Article.find as any).mockReturnValue(mockQuery);

      // Act
      const result = await articleRepository.findByDateRange(startDate, endDate);

      // Assert
      expect(Article.find).toHaveBeenCalledWith({
        publicationDate: {
          $gte: startDate,
          $lte: endDate
        }
      });
      expect(result).toBe(articles);
    });
  });

  describe('findBySource', () => {
    it('should find articles by source', async () => {
      // Arrange
      const source = 'Test Source';
      const articles = [mockArticle];
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue(articles)
      };
      (Article.find as any).mockReturnValue(mockQuery);

      // Act
      const result = await articleRepository.findBySource(source);

      // Assert
      expect(Article.find).toHaveBeenCalledWith({ source });
      expect(result).toBe(articles);
    });
  });

  describe('cleanupOldArticles', () => {
    it('should delete old articles', async () => {
      // Arrange
      const daysOld = 30;
      const mockResult = { deletedCount: 5 };
      (Article.deleteMany as any).mockResolvedValue(mockResult);

      // Act
      const result = await articleRepository.cleanupOldArticles(daysOld);

      // Assert
      expect(Article.deleteMany).toHaveBeenCalled();
      expect(result).toBe(5);
    });

    it('should use default 30 days when not specified', async () => {
      // Arrange
      const mockResult = { deletedCount: 3 };
      (Article.deleteMany as any).mockResolvedValue(mockResult);

      // Act
      const result = await articleRepository.cleanupOldArticles();

      // Assert
      expect(result).toBe(3);
    });
  });
});
