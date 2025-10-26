import { MessageTemplateService } from '@application/services/MessageTemplateService';
import { IArticle } from '@models/Article';

describe('MessageTemplateService', () => {
  let messageTemplateService: MessageTemplateService;

  beforeEach(() => {
    messageTemplateService = new MessageTemplateService();
  });

  describe('formatNewsNotification', () => {
    it('should format news notification', () => {
      // Arrange
      const article: Partial<IArticle> = {
        title: 'Test Article',
        source: 'Test Source',
        url: 'http://test.com/article',
        content: 'Test article content for notification',
        publicationDate: new Date()
      };
      const topicName = 'Technology';

      // Act
      const result = messageTemplateService.formatNewsNotification(article as IArticle, topicName);

      // Assert
      expect(result).toBeDefined();
      expect(result.text).toContain('Test Article');
      expect(result.text).toContain('Technology');
      expect(result.imageUrl).toBe('http://test.com/article');
      expect(result.url).toBe('Test Source');
    });
  });

  describe('formatPodcastNotification', () => {
    it('should format podcast notification', () => {
      // Arrange
      const podcastUrl = 'http://storage.com/podcast.mp3';
      const topics = ['Technology', 'Science'];

      // Act
      const result = messageTemplateService.formatPodcastNotification(podcastUrl, topics);

      // Assert
      expect(result).toContain('Technology');
      expect(result).toContain('Science');
      expect(result).toContain('персональний подкаст');
    });
  });

  describe('formatErrorNotification', () => {
    it('should format error notification', () => {
      // Arrange
      const error = 'Test error message';

      // Act
      const result = messageTemplateService.formatErrorNotification(error);

      // Assert
      expect(result).toContain('Test error message');
    });
  });

  describe('truncateText', () => {
    it('should truncate long text', () => {
      // Arrange
      const longText = 'A'.repeat(1000);
      const maxLength = 100;

      // Act
      const result = messageTemplateService.truncateText(longText, maxLength);

      // Assert
      expect(result.length).toBeLessThanOrEqual(maxLength);
      expect(result).toContain('...');
    });

    it('should not truncate short text', () => {
      // Arrange
      const shortText = 'Short text';
      const maxLength = 100;

      // Act
      const result = messageTemplateService.truncateText(shortText, maxLength);

      // Assert
      expect(result).toBe(shortText);
    });
  });
});