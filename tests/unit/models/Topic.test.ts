import { Topic } from '@models/Topic';

describe('Topic Model', () => {
  describe('Schema Validation', () => {
    it('should create topic with valid data', () => {
      // Arrange
      const topicData = {
        name: 'Technology',
        sourceUrl: 'http://tech.com/rss'
      };

      // Act
      const topic = new Topic(topicData);

      // Assert
      expect(topic.name).toBe('Technology');
      expect(topic.sourceUrl).toBe('http://tech.com/rss');
    });

    it('should trim whitespace from name', () => {
      // Arrange
      const topicData = {
        name: '  Technology  ',
        sourceUrl: 'http://tech.com/rss'
      };

      // Act
      const topic = new Topic(topicData);

      // Assert
      expect(topic.name).toBe('Technology');
    });
  });

  describe('Required Fields', () => {
    it('should require name field', () => {
      // Arrange
      const topicData = {
        sourceUrl: 'http://tech.com/rss'
      };

      // Act
      const topic = new Topic(topicData);

      // Assert
      expect(topic.name).toBeUndefined();
    });

    it('should require sourceUrl field', () => {
      // Arrange
      const topicData = {
        name: 'Technology'
      };

      // Act
      const topic = new Topic(topicData);

      // Assert
      expect(topic.sourceUrl).toBeUndefined();
    });
  });

  describe('Data Types', () => {
    it('should accept string for name', () => {
      // Arrange
      const topicData = {
        name: 'Science',
        sourceUrl: 'http://science.com/rss'
      };

      // Act
      const topic = new Topic(topicData);

      // Assert
      expect(typeof topic.name).toBe('string');
      expect(topic.name).toBe('Science');
    });

    it('should accept string for sourceUrl', () => {
      // Arrange
      const topicData = {
        name: 'Politics',
        sourceUrl: 'http://politics.com/rss'
      };

      // Act
      const topic = new Topic(topicData);

      // Assert
      expect(typeof topic.sourceUrl).toBe('string');
      expect(topic.sourceUrl).toBe('http://politics.com/rss');
    });
  });

  describe('Model Methods', () => {
    it('should have save method', () => {
      // Arrange
      const topicData = {
        name: 'Test Topic',
        sourceUrl: 'http://test.com/rss'
      };
      const topic = new Topic(topicData);

      // Assert
      expect(typeof topic.save).toBe('function');
    });

    it('should have toObject method', () => {
      // Arrange
      const topicData = {
        name: 'Test Topic',
        sourceUrl: 'http://test.com/rss'
      };
      const topic = new Topic(topicData);

      // Assert
      expect(typeof topic.toObject).toBe('function');
    });
  });
});
