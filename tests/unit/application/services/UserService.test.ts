import { UserService } from '@application/services/UserService';
import { IUserRepository } from '@infrastructure/repositories/IUserRepository';
import { IUser, UserRole } from '@models/User';

describe('UserService', () => {
  let userService: UserService;
  let mockUserRepository: jest.Mocked<IUserRepository>;

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

    userService = new UserService(mockUserRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findOrCreateUser', () => {
    it('should return existing user when found', async () => {
      // Arrange
      const telegramId = '123456789';
      const username = 'testuser';
      const existingUser: IUser = {
        _id: telegramId,
        username,
        role: UserRole.USER,
        isBlocked: false,
        createdAt: new Date()
      } as IUser;

      mockUserRepository.findById.mockResolvedValue(existingUser);

      // Act
      const result = await userService.findOrCreateUser(telegramId, username);

      // Assert
      expect(mockUserRepository.findById).toHaveBeenCalledWith(telegramId);
      expect(mockUserRepository.create).not.toHaveBeenCalled();
      expect(result).toBe(existingUser);
    });

    it('should create new user when not found', async () => {
      // Arrange
      const telegramId = '123456789';
      const username = 'testuser';
      const newUser: IUser = {
        _id: telegramId,
        username,
        role: UserRole.USER,
        isBlocked: false,
        createdAt: new Date()
      } as IUser;

      mockUserRepository.findById.mockResolvedValue(null);
      mockUserRepository.create.mockResolvedValue(newUser);

      // Mock console.log to avoid test output pollution
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      // Act
      const result = await userService.findOrCreateUser(telegramId, username);

      // Assert
      expect(mockUserRepository.findById).toHaveBeenCalledWith(telegramId);
      expect(mockUserRepository.create).toHaveBeenCalledWith({
        _id: telegramId,
        username,
        role: UserRole.USER,
        isBlocked: false,
        createdAt: expect.any(Date)
      });
      expect(consoleSpy).toHaveBeenCalledWith(`Created new user: ${telegramId}`);
      expect(result).toBe(newUser);

      // Cleanup
      consoleSpy.mockRestore();
    });

    it('should throw error when telegramId is empty', async () => {
      // Arrange
      const telegramId = '';
      const username = 'testuser';

      // Act & Assert
      await expect(userService.findOrCreateUser(telegramId, username)).rejects.toThrow(
        'Telegram ID is required'
      );
    });

    it('should throw error when telegramId is null', async () => {
      // Arrange
      const telegramId = null as any;
      const username = 'testuser';

      // Act & Assert
      await expect(userService.findOrCreateUser(telegramId, username)).rejects.toThrow(
        'Telegram ID is required'
      );
    });
  });

  describe('findById', () => {
    it('should return user when found', async () => {
      // Arrange
      const id = '123456789';
      const user: IUser = {
        _id: id,
        username: 'testuser',
        role: UserRole.USER,
        isBlocked: false,
        createdAt: new Date()
      } as IUser;

      mockUserRepository.findById.mockResolvedValue(user);

      // Act
      const result = await userService.findById(id);

      // Assert
      expect(mockUserRepository.findById).toHaveBeenCalledWith(id);
      expect(result).toBe(user);
    });

    it('should return null when user not found', async () => {
      // Arrange
      const id = 'nonexistent';
      mockUserRepository.findById.mockResolvedValue(null);

      // Act
      const result = await userService.findById(id);

      // Assert
      expect(mockUserRepository.findById).toHaveBeenCalledWith(id);
      expect(result).toBeNull();
    });
  });

  describe('createUser', () => {
    it('should create user with provided data', async () => {
      // Arrange
      const telegramId = '123456789';
      const username = 'testuser';
      const newUser: IUser = {
        _id: telegramId,
        username,
        role: UserRole.USER,
        isBlocked: false,
        createdAt: new Date()
      } as IUser;

      mockUserRepository.create.mockResolvedValue(newUser);

      // Act
      const result = await userService.createUser(telegramId, username);

      // Assert
      expect(mockUserRepository.create).toHaveBeenCalledWith({
        _id: telegramId,
        username,
        role: UserRole.USER,
        isBlocked: false,
        createdAt: expect.any(Date)
      });
      expect(result).toBe(newUser);
    });

    it('should create user without username', async () => {
      // Arrange
      const telegramId = '123456789';
      const newUser: IUser = {
        _id: telegramId,
        username: undefined,
        role: UserRole.USER,
        isBlocked: false,
        createdAt: new Date()
      } as IUser;

      mockUserRepository.create.mockResolvedValue(newUser);

      // Act
      const result = await userService.createUser(telegramId);

      // Assert
      expect(mockUserRepository.create).toHaveBeenCalledWith({
        _id: telegramId,
        username: undefined,
        role: UserRole.USER,
        isBlocked: false,
        createdAt: expect.any(Date)
      });
      expect(result).toBe(newUser);
    });
  });
});
