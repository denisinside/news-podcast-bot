import { Podcast, PodcastStatus } from '@models/Podcast';
import { Types } from 'mongoose';

describe('Podcast Model', () => {
  describe('Schema Validation', () => {
    it('should create podcast with valid data', () => {
      // Arrange
      const podcastData = {
        userId: 123456,
        status: PodcastStatus.PENDING,
        articles: [new Types.ObjectId(), new Types.ObjectId()]
      };

      // Act
      const podcast = new Podcast(podcastData);

      // Assert
      expect(podcast.userId).toBe(123456);
      expect(podcast.status).toBe(PodcastStatus.PENDING);
      expect(podcast.articles).toHaveLength(2);
    });

    it('should create podcast with optional fileUrl', () => {
      // Arrange
      const podcastData = {
        userId: 123456,
        fileUrl: 'http://storage.com/podcast.mp3'
      };

      // Act
      const podcast = new Podcast(podcastData);

      // Assert
      expect(podcast.fileUrl).toBe('http://storage.com/podcast.mp3');
    });
  });

  describe('Default Values', () => {
    it('should set default status to PENDING', () => {
      // Arrange
      const podcastData = { userId: 123456 };

      // Act
      const podcast = new Podcast(podcastData);

      // Assert
      expect(podcast.status).toBe(PodcastStatus.PENDING);
    });

    it('should set default creationDate to current date', () => {
      // Arrange
      const podcastData = { userId: 123456 };
      const beforeCreation = new Date();

      // Act
      const podcast = new Podcast(podcastData);

      // Assert
      expect(podcast.creationDate).toBeInstanceOf(Date);
      expect(podcast.creationDate.getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime());
    });

    it('should set default articles to empty array', () => {
      // Arrange
      const podcastData = { userId: 123456 };

      // Act
      const podcast = new Podcast(podcastData);

      // Assert
      expect(podcast.articles).toEqual([]);
    });
  });

  describe('PodcastStatus Enum', () => {
    it('should accept PENDING status', () => {
      // Arrange
      const podcastData = { userId: 123456, status: PodcastStatus.PENDING };

      // Act
      const podcast = new Podcast(podcastData);

      // Assert
      expect(podcast.status).toBe(PodcastStatus.PENDING);
    });

    it('should accept GENERATING status', () => {
      // Arrange
      const podcastData = { userId: 123456, status: PodcastStatus.GENERATING };

      // Act
      const podcast = new Podcast(podcastData);

      // Assert
      expect(podcast.status).toBe(PodcastStatus.GENERATING);
    });

    it('should accept READY status', () => {
      // Arrange
      const podcastData = { userId: 123456, status: PodcastStatus.READY };

      // Act
      const podcast = new Podcast(podcastData);

      // Assert
      expect(podcast.status).toBe(PodcastStatus.READY);
    });

    it('should accept FAILED status', () => {
      // Arrange
      const podcastData = { userId: 123456, status: PodcastStatus.FAILED };

      // Act
      const podcast = new Podcast(podcastData);

      // Assert
      expect(podcast.status).toBe(PodcastStatus.FAILED);
    });
  });

  describe('Data Types', () => {
    it('should accept number for userId', () => {
      // Arrange
      const podcastData = { userId: 987654 };

      // Act
      const podcast = new Podcast(podcastData);

      // Assert
      expect(typeof podcast.userId).toBe('number');
      expect(podcast.userId).toBe(987654);
    });

    it('should accept Date for creationDate', () => {
      // Arrange
      const testDate = new Date('2023-01-01');
      const podcastData = { userId: 123456, creationDate: testDate };

      // Act
      const podcast = new Podcast(podcastData);

      // Assert
      expect(podcast.creationDate).toBeInstanceOf(Date);
      expect(podcast.creationDate).toEqual(testDate);
    });

    it('should accept array of ObjectIds for articles', () => {
      // Arrange
      const articles = [new Types.ObjectId(), new Types.ObjectId()];
      const podcastData = { userId: 123456, articles };

      // Act
      const podcast = new Podcast(podcastData);

      // Assert
      expect(Array.isArray(podcast.articles)).toBe(true);
      expect(podcast.articles).toHaveLength(2);
      expect(podcast.articles[0]).toBeInstanceOf(Types.ObjectId);
    });
  });

  describe('Model Methods', () => {
    it('should have save method', () => {
      // Arrange
      const podcastData = { userId: 123456 };
      const podcast = new Podcast(podcastData);

      // Assert
      expect(typeof podcast.save).toBe('function');
    });

    it('should have toObject method', () => {
      // Arrange
      const podcastData = { userId: 123456 };
      const podcast = new Podcast(podcastData);

      // Assert
      expect(typeof podcast.toObject).toBe('function');
    });
  });
});
