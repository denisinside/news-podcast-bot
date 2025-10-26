import { IArticle } from '@models/Article';
import { ITopic } from '@models/Topic';
import { IUser, UserRole } from '@models/User';
import { IPodcast, PodcastStatus } from '@models/Podcast';
import { ISubscription } from '@models/Subscription';
import { Types } from 'mongoose';

// Mock factories for entities
export const createMockArticle = (overrides: Partial<IArticle> = {}): IArticle => ({
  _id: new Types.ObjectId().toHexString(),
  title: 'Test Article Title',
  url: `http://test.com/${Math.random()}`,
  content: 'Test article content.',
  publicationDate: new Date(),
  source: 'Test Source',
  topicId: new Types.ObjectId(),
  ...overrides,
} as IArticle);

export const createMockTopic = (overrides: Partial<ITopic> = {}): ITopic => ({
  _id: new Types.ObjectId().toHexString(),
  name: 'Test Topic',
  sourceUrl: `http://test-topic.com/${Math.random()}`,
  ...overrides,
} as ITopic);

export const createMockUser = (overrides: Partial<IUser> = {}): IUser => ({
  _id: new Types.ObjectId().toHexString(),
  username: `testuser_${Math.random().toString(36).substring(7)}`,
  role: UserRole.USER,
  isBlocked: false,
  createdAt: new Date(),
  ...overrides,
} as IUser);

export const createMockPodcast = (overrides: Partial<IPodcast> = {}): IPodcast => ({
  _id: new Types.ObjectId().toHexString(),
  userId: Math.floor(Math.random() * 1000000), // number, not string
  creationDate: new Date(),
  status: PodcastStatus.PENDING,
  articles: [],
  ...overrides,
} as IPodcast);

export const createMockSubscription = (overrides: Partial<ISubscription> = {}): ISubscription => ({
  _id: new Types.ObjectId().toHexString(),
  userId: new Types.ObjectId().toHexString(),
  topicId: new Types.ObjectId(),
  isActive: true,
  subscribedAt: new Date(),
  ...overrides,
} as ISubscription);

// Mock factories for repositories
export const createMockArticleRepository = () => ({
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
  cleanupOldArticles: jest.fn(),
});

export const createMockTopicRepository = () => ({
  findAll: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  findBySourceUrl: jest.fn(),
});

export const createMockUserRepository = () => ({
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
});

export const createMockPodcastRepository = () => ({
  create: jest.fn(),
  update: jest.fn(),
  findById: jest.fn(),
  findByUserId: jest.fn(),
  findAll: jest.fn(),
  delete: jest.fn(),
});

export const createMockSubscriptionRepository = () => ({
  findByUserId: jest.fn(),
  create: jest.fn(),
  delete: jest.fn(),
  exists: jest.fn(),
  findByTopicId: jest.fn(),
});

// Mock factories for clients
export const createMockGeminiClient = () => ({
  generateText: jest.fn(),
  generateAudio: jest.fn(),
});

export const createMockFileStorageClient = () => ({
  upload: jest.fn(),
});

export const createMockQueueClient = () => ({
  addNewsFetchJob: jest.fn(),
  addPodcastJob: jest.fn(),
});

// Test data arrays
export const mockArticles = [
  createMockArticle({ title: 'Article 1', url: 'http://test.com/1' }),
  createMockArticle({ title: 'Article 2', url: 'http://test.com/2' }),
  createMockArticle({ title: 'Article 3', url: 'http://test.com/3' }),
];

export const mockTopics = [
  createMockTopic({ name: 'Technology', sourceUrl: 'http://tech.com/rss' }),
  createMockTopic({ name: 'Science', sourceUrl: 'http://science.com/rss' }),
  createMockTopic({ name: 'Politics', sourceUrl: 'http://politics.com/rss' }),
];

export const mockUsers = [
  createMockUser({ username: 'user1' }),
  createMockUser({ username: 'user2' }),
  createMockUser({ username: 'user3' })
];

export const mockPodcasts = [
  createMockPodcast({ userId: 111111111 }),
  createMockPodcast({ userId: 222222222 }),
  createMockPodcast({ userId: 333333333 })
];

export const mockSubscriptions = [
  createMockSubscription({ userId: new Types.ObjectId().toHexString(), topicId: new Types.ObjectId() }),
  createMockSubscription({ userId: new Types.ObjectId().toHexString(), topicId: new Types.ObjectId() }),
  createMockSubscription({ userId: new Types.ObjectId().toHexString(), topicId: new Types.ObjectId() })
];