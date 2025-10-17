import { User } from '@models/User';
import { UserRole } from '@models/User';

describe('User Model', () => {
  describe('Schema Validation', () => {
    it('should create user with valid data', () => {
      // Arrange
      const userData = {
        _id: 'test-id',
        username: 'testuser',
        role: UserRole.USER,
        isBlocked: false,
        createdAt: new Date()
      };

      // Act
      const user = new User(userData);

      // Assert
      expect(user._id).toBe('test-id');
      expect(user.username).toBe('testuser');
      expect(user.role).toBe(UserRole.USER);
      expect(user.isBlocked).toBe(false);
    });

    it('should create user with minimal required data', () => {
      // Arrange
      const userData = {
        _id: 'test-id',
        role: UserRole.USER
      };

      // Act
      const user = new User(userData);

      // Assert
      expect(user._id).toBe('test-id');
      expect(user.role).toBe(UserRole.USER);
      expect(user.isBlocked).toBe(false);
    });
  });

  describe('Default Values', () => {
    it('should set default role to USER', () => {
      // Arrange
      const userData = { _id: 'test-id' };

      // Act
      const user = new User(userData);

      // Assert
      expect(user.role).toBe(UserRole.USER);
    });

    it('should set default isBlocked to false', () => {
      // Arrange
      const userData = { _id: 'test-id' };

      // Act
      const user = new User(userData);

      // Assert
      expect(user.isBlocked).toBe(false);
    });
  });

  describe('UserRole Enum', () => {
    it('should accept USER role', () => {
      // Arrange
      const userData = { _id: 'test-id', role: UserRole.USER };

      // Act
      const user = new User(userData);

      // Assert
      expect(user.role).toBe(UserRole.USER);
    });

    it('should accept ADMIN role', () => {
      // Arrange
      const userData = { _id: 'test-id', role: UserRole.ADMIN };

      // Act
      const user = new User(userData);

      // Assert
      expect(user.role).toBe(UserRole.ADMIN);
    });

    it('should accept OWNER role', () => {
      // Arrange
      const userData = { _id: 'test-id', role: UserRole.OWNER };

      // Act
      const user = new User(userData);

      // Assert
      expect(user.role).toBe(UserRole.OWNER);
    });
  });
});