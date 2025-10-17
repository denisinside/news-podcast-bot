import { PodcastRepository } from '@infrastructure/repositories/PodcastRepository';
import { Podcast } from '@models/Podcast';
import { Types } from 'mongoose';

// Mock the Podcast model
jest.mock('@models/Podcast');

describe('PodcastRepository', () => {
  let podcastRepository: PodcastRepository;
  let mockPodcast: any;

  beforeEach(() => {
    podcastRepository = new PodcastRepository();
    
    // Create mock podcast instance
    mockPodcast = {
      save: jest.fn(),
      _id: 'test-podcast-id',
      userId: 123456,
      creationDate: new Date(),
      status: 'PENDING',
      articles: [new Types.ObjectId(), new Types.ObjectId()]
    };

    // Mock Podcast constructor and static methods
    (Podcast as any).mockImplementation(() => mockPodcast);
    (Podcast.findById as any) = jest.fn();
    (Podcast.find as any) = jest.fn();
    (Podcast.findByIdAndUpdate as any) = jest.fn();
    (Podcast.findByIdAndDelete as any) = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create new podcast', async () => {
      // Arrange
      const data = {
        userId: 'test-user-id',
        articles: [new Types.ObjectId(), new Types.ObjectId()]
      };
      mockPodcast.save.mockResolvedValue(mockPodcast);

      // Act
      const result = await podcastRepository.create(data);

      // Assert
      expect(Podcast).toHaveBeenCalledWith(data);
      expect(mockPodcast.save).toHaveBeenCalled();
      expect(result).toBe(mockPodcast);
    });
  });

  describe('update', () => {
    it('should update podcast', async () => {
      // Arrange
      const id = new Types.ObjectId();
      const data = { status: 'READY', fileUrl: 'http://storage.com/podcast.mp3' };
      (Podcast.findByIdAndUpdate as any).mockResolvedValue(mockPodcast);

      // Act
      const result = await podcastRepository.update(id, data);

      // Assert
      expect(Podcast.findByIdAndUpdate).toHaveBeenCalledWith(id, data, { new: true });
      expect(result).toBe(mockPodcast);
    });

    it('should return null when podcast not found', async () => {
      // Arrange
      const id = new Types.ObjectId();
      const data = { status: 'READY' };
      (Podcast.findByIdAndUpdate as any).mockResolvedValue(null);

      // Act
      const result = await podcastRepository.update(id, data);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('findById', () => {
    it('should find podcast by ID with populated articles', async () => {
      // Arrange
      const id = 'test-podcast-id';
      const mockQuery = {
        populate: jest.fn().mockResolvedValue(mockPodcast)
      };
      (Podcast.findById as any).mockReturnValue(mockQuery);

      // Act
      const result = await podcastRepository.findById(id);

      // Assert
      expect(Podcast.findById).toHaveBeenCalledWith(id);
      expect(mockQuery.populate).toHaveBeenCalledWith('articles');
      expect(result).toBe(mockPodcast);
    });
  });

  describe('findByUserId', () => {
    it('should find podcasts by user ID', async () => {
      // Arrange
      const userId = 'test-user-id';
      const podcasts = [mockPodcast];
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue(podcasts)
      };
      (Podcast.find as any).mockReturnValue(mockQuery);

      // Act
      const result = await podcastRepository.findByUserId(userId);

      // Assert
      expect(Podcast.find).toHaveBeenCalledWith({ userId });
      expect(mockQuery.populate).toHaveBeenCalledWith('articles');
      expect(mockQuery.sort).toHaveBeenCalledWith({ creationDate: -1 });
      expect(result).toBe(podcasts);
    });
  });

  describe('findAll', () => {
    it('should return all podcasts with populated articles', async () => {
      // Arrange
      const podcasts = [mockPodcast];
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue(podcasts)
      };
      (Podcast.find as any).mockReturnValue(mockQuery);

      // Act
      const result = await podcastRepository.findAll();

      // Assert
      expect(Podcast.find).toHaveBeenCalledWith();
      expect(mockQuery.populate).toHaveBeenCalledWith('articles');
      expect(mockQuery.sort).toHaveBeenCalledWith({ creationDate: -1 });
      expect(result).toBe(podcasts);
    });
  });

  describe('delete', () => {
    it('should delete podcast', async () => {
      // Arrange
      const id = 'test-podcast-id';
      (Podcast.findByIdAndDelete as any).mockResolvedValue(mockPodcast);

      // Act
      const result = await podcastRepository.delete(id);

      // Assert
      expect(Podcast.findByIdAndDelete).toHaveBeenCalledWith(id);
      expect(result).toBe(true);
    });

    it('should return false when podcast not found', async () => {
      // Arrange
      const id = 'nonexistent-id';
      (Podcast.findByIdAndDelete as any).mockResolvedValue(null);

      // Act
      const result = await podcastRepository.delete(id);

      // Assert
      expect(result).toBe(false);
    });
  });
});
