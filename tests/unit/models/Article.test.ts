import { Article } from '@models/Article';
import { Types } from 'mongoose';

describe('Article Model', () => {
  describe('Schema Validation', () => {
    it('should create article with valid data', () => {
      // Arrange
      const articleData = {
        title: 'Test Article Title',
        url: 'http://test.com/article',
        content: 'Test article content.',
        publicationDate: new Date(),
        source: 'Test Source',
        topicId: new Types.ObjectId()
      };

      // Act
      const article = new Article(articleData);

      // Assert
      expect(article.title).toBe(articleData.title);
      expect(article.url).toBe(articleData.url);
      expect(article.content).toBe(articleData.content);
      expect(article.source).toBe(articleData.source);
    });

    it('should create article with optional imageUrl', () => {
      // Arrange
      const articleData = {
        title: 'Test Article',
        url: 'http://test.com/article',
        content: 'Test content',
        publicationDate: new Date(),
        source: 'Test Source',
        topicId: new Types.ObjectId(),
        imageUrl: 'http://test.com/image.jpg'
      };

      // Act
      const article = new Article(articleData);

      // Assert
      expect(article.imageUrl).toBe('http://test.com/image.jpg');
    });
  });

  describe('Data Types', () => {
    it('should accept string for title', () => {
      // Arrange
      const articleData = {
        title: 'Test Title',
        url: 'http://test.com/article',
        content: 'Test content',
        publicationDate: new Date(),
        source: 'Test Source',
        topicId: new Types.ObjectId()
      };

      // Act
      const article = new Article(articleData);

      // Assert
      expect(typeof article.title).toBe('string');
      expect(article.title).toBe('Test Title');
    });

    it('should accept Date for publicationDate', () => {
      // Arrange
      const testDate = new Date('2023-01-01');
      const articleData = {
        title: 'Test Title',
        url: 'http://test.com/article',
        content: 'Test content',
        publicationDate: testDate,
        source: 'Test Source',
        topicId: new Types.ObjectId()
      };

      // Act
      const article = new Article(articleData);

      // Assert
      expect(article.publicationDate).toBeInstanceOf(Date);
      expect(article.publicationDate).toEqual(testDate);
    });
  });
});