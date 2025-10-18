import { UserRepository } from '@infrastructure/repositories/UserRepository';
import { User } from '@models/User';
import { UserRole } from '@models/User';

// Mock the User model
jest.mock('@models/User');

describe('UserRepository', () => {
  let userRepository: UserRepository;
  let mockUser: any;

  beforeEach(() => {
    userRepository = new UserRepository();
    
    // Create mock user instance
    mockUser = {
      save: jest.fn(),
      _id: 'test-user-id',
      username: 'testuser',
      role: UserRole.USER,
      isBlocked: false,
      createdAt: new Date()
    };

    // Mock User constructor and static methods
    (User as any).mockImplementation(() => mockUser);
    (User.findById as any) = jest.fn();
    (User.find as any) = jest.fn();
    (User.findByIdAndUpdate as any) = jest.fn();
    (User.findByIdAndDelete as any) = jest.fn();
    (User.countDocuments as any) = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findByTelegramId', () => {
    it('should find user by telegram ID', async () => {
      // Arrange
      const telegramId = 123456789;
      (User.findById as any).mockResolvedValue(mockUser);

      // Act
      const result = await userRepository.findByTelegramId(telegramId);

      // Assert
      expect(User.findById).toHaveBeenCalledWith(String(telegramId));
      expect(result).toBe(mockUser);
    });

    it('should return null when user not found', async () => {
      // Arrange
      const telegramId = 999999999;
      (User.findById as any).mockResolvedValue(null);

      // Act
      const result = await userRepository.findByTelegramId(telegramId);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create new user', async () => {
      // Arrange
      const userData = {
        _id: 'test-user-id',
        username: 'testuser',
        role: UserRole.USER,
        isBlocked: false,
        createdAt: new Date()
      };
      mockUser.save.mockResolvedValue(mockUser);

      // Act
      const result = await userRepository.create(userData);

      // Assert
      expect(User).toHaveBeenCalledWith(userData);
      expect(mockUser.save).toHaveBeenCalled();
      expect(result).toBe(mockUser);
    });
  });

  describe('findById', () => {
    it('should find user by ID', async () => {
      // Arrange
      const id = 'test-user-id';
      (User.findById as any).mockResolvedValue(mockUser);

      // Act
      const result = await userRepository.findById(id);

      // Assert
      expect(User.findById).toHaveBeenCalledWith(id);
      expect(result).toBe(mockUser);
    });
  });

  describe('update', () => {
    it('should update user', async () => {
      // Arrange
      const id = 'test-user-id';
      const updateData = { username: 'updated-username' };
      (User.findByIdAndUpdate as any).mockResolvedValue(mockUser);

      // Act
      const result = await userRepository.update(id, updateData);

      // Assert
      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(id, updateData, { new: true });
      expect(result).toBe(mockUser);
    });
  });

  describe('delete', () => {
    it('should delete user', async () => {
      // Arrange
      const id = 'test-user-id';
      (User.findByIdAndDelete as any).mockResolvedValue(mockUser);

      // Act
      const result = await userRepository.delete(id);

      // Assert
      expect(User.findByIdAndDelete).toHaveBeenCalledWith(id);
      expect(result).toBe(true);
    });

    it('should return false when user not found', async () => {
      // Arrange
      const id = 'nonexistent-id';
      (User.findByIdAndDelete as any).mockResolvedValue(null);

      // Act
      const result = await userRepository.delete(id);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('findAll', () => {
    it('should return all users', async () => {
      // Arrange
      const users = [mockUser];
      (User.find as any).mockResolvedValue(users);

      // Act
      const result = await userRepository.findAll();

      // Assert
      expect(User.find).toHaveBeenCalledWith();
      expect(result).toBe(users);
    });
  });

  describe('findByRole', () => {
    it('should find users by role', async () => {
      // Arrange
      const role = UserRole.ADMIN;
      const users = [mockUser];
      (User.find as any).mockResolvedValue(users);

      // Act
      const result = await userRepository.findByRole(role);

      // Assert
      expect(User.find).toHaveBeenCalledWith({ role });
      expect(result).toBe(users);
    });
  });

  describe('blockUser', () => {
    it('should block user', async () => {
      // Arrange
      const id = 'test-user-id';
      (User.findByIdAndUpdate as any).mockResolvedValue(mockUser);

      // Act
      const result = await userRepository.blockUser(id);

      // Assert
      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(id, { isBlocked: true }, { new: true });
      expect(result).toBe(mockUser);
    });
  });

  describe('unblockUser', () => {
    it('should unblock user', async () => {
      // Arrange
      const id = 'test-user-id';
      (User.findByIdAndUpdate as any).mockResolvedValue(mockUser);

      // Act
      const result = await userRepository.unblockUser(id);

      // Assert
      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(id, { isBlocked: false }, { new: true });
      expect(result).toBe(mockUser);
    });
  });

  describe('countActiveUsers', () => {
    it('should count active users', async () => {
      // Arrange
      (User.countDocuments as any).mockResolvedValue(5);

      // Act
      const result = await userRepository.countActiveUsers();

      // Assert
      expect(User.countDocuments).toHaveBeenCalledWith({ isBlocked: false });
      expect(result).toBe(5);
    });
  });

  describe('countNewUsers', () => {
    it('should count new users since date', async () => {
      // Arrange
      const since = new Date('2023-01-01');
      (User.countDocuments as any).mockResolvedValue(3);

      // Act
      const result = await userRepository.countNewUsers(since);

      // Assert
      expect(User.countDocuments).toHaveBeenCalledWith({
        createdAt: { $gte: since }
      });
      expect(result).toBe(3);
    });
  });
});
