import { TopicRepository } from '@infrastructure/repositories/TopicRepository';
import { Topic } from '@models/Topic';

// Mock the Topic model
jest.mock('@models/Topic');

describe('TopicRepository', () => {
  let topicRepository: TopicRepository;
  let mockTopic: any;

  beforeEach(() => {
    topicRepository = new TopicRepository();
    
    // Create mock topic instance
    mockTopic = {
      save: jest.fn(),
      _id: 'test-topic-id',
      name: 'Technology',
      sourceUrl: 'http://tech.com/rss'
    };

    // Mock Topic constructor and static methods
    (Topic as any).mockImplementation(() => mockTopic);
    (Topic.find as any) = jest.fn();
    (Topic.findById as any) = jest.fn();
    (Topic.findOne as any) = jest.fn();
    (Topic.findByIdAndUpdate as any) = jest.fn();
    (Topic.findByIdAndDelete as any) = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return all topics', async () => {
      // Arrange
      const topics = [mockTopic];
      const mockQuery = {
        sort: jest.fn().mockResolvedValue(topics)
      };
      (Topic.find as any).mockReturnValue(mockQuery);

      // Act
      const result = await topicRepository.findAll();

      // Assert
      expect(Topic.find).toHaveBeenCalledWith();
      expect(mockQuery.sort).toHaveBeenCalledWith({ name: 1 });
      expect(result).toBe(topics);
    });
  });

  describe('findById', () => {
    it('should find topic by ID', async () => {
      // Arrange
      const id = 'test-topic-id';
      (Topic.findById as any).mockResolvedValue(mockTopic);

      // Act
      const result = await topicRepository.findById(id);

      // Assert
      expect(Topic.findById).toHaveBeenCalledWith(id);
      expect(result).toBe(mockTopic);
    });
  });

  describe('create', () => {
    it('should create new topic', async () => {
      // Arrange
      const topicData = {
        name: 'Technology',
        sourceUrl: 'http://tech.com/rss'
      };
      (Topic.findOne as any).mockResolvedValue(null); // No existing topic
      mockTopic.save.mockResolvedValue(mockTopic);

      // Act
      const result = await topicRepository.create(topicData);

      // Assert
      expect(Topic.findOne).toHaveBeenCalledWith({ sourceUrl: topicData.sourceUrl });
      expect(Topic).toHaveBeenCalledWith(topicData);
      expect(mockTopic.save).toHaveBeenCalled();
      expect(result).toBe(mockTopic);
    });

    it('should throw error when topic with same sourceUrl exists', async () => {
      // Arrange
      const topicData = {
        name: 'Technology',
        sourceUrl: 'http://tech.com/rss'
      };
      (Topic.findOne as any).mockResolvedValue(mockTopic); // Existing topic

      // Act & Assert
      await expect(topicRepository.create(topicData)).rejects.toThrow(
        `Topic with sourceUrl '${topicData.sourceUrl}' already exists`
      );
    });
  });

  describe('update', () => {
    it('should update topic', async () => {
      // Arrange
      const id = 'test-topic-id';
      const updateData = { name: 'Updated Topic' };
      (Topic.findByIdAndUpdate as any).mockResolvedValue(mockTopic);

      // Act
      const result = await topicRepository.update(id, updateData);

      // Assert
      expect(Topic.findByIdAndUpdate).toHaveBeenCalledWith(id, updateData, { new: true });
      expect(result).toBe(mockTopic);
    });
  });

  describe('delete', () => {
    it('should delete topic', async () => {
      // Arrange
      const id = 'test-topic-id';
      (Topic.findByIdAndDelete as any).mockResolvedValue(mockTopic);

      // Act
      const result = await topicRepository.delete(id);

      // Assert
      expect(Topic.findByIdAndDelete).toHaveBeenCalledWith(id);
      expect(result).toBe(true);
    });

    it('should return false when topic not found', async () => {
      // Arrange
      const id = 'nonexistent-id';
      (Topic.findByIdAndDelete as any).mockResolvedValue(null);

      // Act
      const result = await topicRepository.delete(id);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('findBySourceUrl', () => {
    it('should find topic by source URL', async () => {
      // Arrange
      const sourceUrl = 'http://tech.com/rss';
      (Topic.findOne as any).mockResolvedValue(mockTopic);

      // Act
      const result = await topicRepository.findBySourceUrl(sourceUrl);

      // Assert
      expect(Topic.findOne).toHaveBeenCalledWith({ sourceUrl });
      expect(result).toBe(mockTopic);
    });

    it('should return null when topic not found', async () => {
      // Arrange
      const sourceUrl = 'http://nonexistent.com/rss';
      (Topic.findOne as any).mockResolvedValue(null);

      // Act
      const result = await topicRepository.findBySourceUrl(sourceUrl);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('findByName', () => {
    it('should find topic by name', async () => {
      // Arrange
      const name = 'Technology';
      (Topic.findOne as any).mockResolvedValue(mockTopic);

      // Act
      const result = await topicRepository.findByName(name);

      // Assert
      expect(Topic.findOne).toHaveBeenCalledWith({ name });
      expect(result).toBe(mockTopic);
    });
  });
});
