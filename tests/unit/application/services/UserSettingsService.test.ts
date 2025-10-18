import { UserSettingsService } from '@application/services/UserSettingsService';
import { UserSettings, IUserSettings, NewsFrequency } from '@models/UserSettings';

// Mock the UserSettings model
jest.mock('@models/UserSettings');

describe('UserSettingsService', () => {
  let userSettingsService: UserSettingsService;
  let mockUserSettings: any;

  beforeEach(() => {
    userSettingsService = new UserSettingsService();
    
    // Create mock UserSettings instance
    mockUserSettings = {
      save: jest.fn(),
      _id: 'settings-id',
      userId: 12345,
      newsFrequency: NewsFrequency.DAILY,
      enableAudioPodcasts: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Mock UserSettings constructor and static methods
    (UserSettings as any).mockImplementation(() => mockUserSettings);
    (UserSettings.findOne as any) = jest.fn();
    (UserSettings.findOneAndUpdate as any) = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserSettings', () => {
    it('should return existing settings when found', async () => {
      // Arrange
      const userId = 12345;
      (UserSettings.findOne as any).mockResolvedValue(mockUserSettings);

      // Mock console.log to avoid test output pollution
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      // Act
      const result = await userSettingsService.getUserSettings(userId);

      // Assert
      expect(UserSettings.findOne).toHaveBeenCalledWith({ userId });
      expect(consoleSpy).toHaveBeenCalledWith(`Getting settings for user ${userId}`);
      expect(result).toBe(mockUserSettings);

      // Cleanup
      consoleSpy.mockRestore();
    });

    it('should create default settings when not found', async () => {
      // Arrange
      const userId = 12345;
      (UserSettings.findOne as any).mockResolvedValue(null);
      mockUserSettings.save.mockResolvedValue(mockUserSettings);

      // Mock console.log to avoid test output pollution
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      // Act
      const result = await userSettingsService.getUserSettings(userId);

      // Assert
      expect(UserSettings.findOne).toHaveBeenCalledWith({ userId });
      expect(UserSettings).toHaveBeenCalledWith({
        userId,
        newsFrequency: NewsFrequency.DAILY,
        enableAudioPodcasts: false
      });
      expect(mockUserSettings.save).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith(`Getting settings for user ${userId}`);
      expect(consoleSpy).toHaveBeenCalledWith(`Creating default settings for user ${userId}`);
      expect(result).toBe(mockUserSettings);

      // Cleanup
      consoleSpy.mockRestore();
    });
  });

  describe('createDefaultSettings', () => {
    it('should create and save default settings', async () => {
      // Arrange
      const userId = 12345;
      mockUserSettings.save.mockResolvedValue(mockUserSettings);

      // Mock console.log to avoid test output pollution
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      // Act
      const result = await userSettingsService.createDefaultSettings(userId);

      // Assert
      expect(UserSettings).toHaveBeenCalledWith({
        userId,
        newsFrequency: NewsFrequency.DAILY,
        enableAudioPodcasts: false
      });
      expect(mockUserSettings.save).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith(`Creating default settings for user ${userId}`);
      expect(result).toBe(mockUserSettings);

      // Cleanup
      consoleSpy.mockRestore();
    });
  });

  describe('updateNewsFrequency', () => {
    it('should update news frequency', async () => {
      // Arrange
      const userId = 12345;
      const frequency = NewsFrequency.HOURLY;
      (UserSettings.findOneAndUpdate as any).mockResolvedValue(mockUserSettings);

      // Mock console.log to avoid test output pollution
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      // Act
      await userSettingsService.updateNewsFrequency(userId, frequency);

      // Assert
      expect(UserSettings.findOneAndUpdate).toHaveBeenCalledWith(
        { userId },
        { newsFrequency: frequency },
        { upsert: true, new: true }
      );
      expect(consoleSpy).toHaveBeenCalledWith(`Updating news frequency for user ${userId} to ${frequency}`);

      // Cleanup
      consoleSpy.mockRestore();
    });
  });

  describe('updateAudioPodcasts', () => {
    it('should update audio podcasts setting', async () => {
      // Arrange
      const userId = 12345;
      const enabled = true;
      (UserSettings.findOneAndUpdate as any).mockResolvedValue(mockUserSettings);

      // Mock console.log to avoid test output pollution
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      // Act
      await userSettingsService.updateAudioPodcasts(userId, enabled);

      // Assert
      expect(UserSettings.findOneAndUpdate).toHaveBeenCalledWith(
        { userId },
        { enableAudioPodcasts: enabled },
        { upsert: true, new: true }
      );
      expect(consoleSpy).toHaveBeenCalledWith(`Updating audio podcasts for user ${userId} to ${enabled}`);

      // Cleanup
      consoleSpy.mockRestore();
    });

    it('should update audio podcasts setting to disabled', async () => {
      // Arrange
      const userId = 12345;
      const enabled = false;
      (UserSettings.findOneAndUpdate as any).mockResolvedValue(mockUserSettings);

      // Mock console.log to avoid test output pollution
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      // Act
      await userSettingsService.updateAudioPodcasts(userId, enabled);

      // Assert
      expect(UserSettings.findOneAndUpdate).toHaveBeenCalledWith(
        { userId },
        { enableAudioPodcasts: enabled },
        { upsert: true, new: true }
      );
      expect(consoleSpy).toHaveBeenCalledWith(`Updating audio podcasts for user ${userId} to ${enabled}`);

      // Cleanup
      consoleSpy.mockRestore();
    });
  });
});
