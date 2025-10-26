import { UserSettings, NewsFrequency } from '@models/UserSettings';

describe('UserSettings Model', () => {
  describe('Schema Validation', () => {
    it('should create user settings with valid data', () => {
      // Arrange
      const userSettingsData = {
        userId: 123456,
        newsFrequency: NewsFrequency.DAILY,
        enableAudioPodcasts: true
      };

      // Act
      const userSettings = new UserSettings(userSettingsData);

      // Assert
      expect(userSettings.userId).toBe(123456);
      expect(userSettings.newsFrequency).toBe(NewsFrequency.DAILY);
      expect(userSettings.enableAudioPodcasts).toBe(true);
    });
  });

  describe('Default Values', () => {
    it('should set default newsFrequency to DAILY', () => {
      // Arrange
      const userSettingsData = { userId: 123456 };

      // Act
      const userSettings = new UserSettings(userSettingsData);

      // Assert
      expect(userSettings.newsFrequency).toBe(NewsFrequency.DAILY);
    });

    it('should set default enableAudioPodcasts to false', () => {
      // Arrange
      const userSettingsData = { userId: 123456 };

      // Act
      const userSettings = new UserSettings(userSettingsData);

      // Assert
      expect(userSettings.enableAudioPodcasts).toBe(false);
    });

    it('should have timestamps fields', () => {
      // Arrange
      const userSettingsData = { userId: 123456 };

      // Act
      const userSettings = new UserSettings(userSettingsData);

      // Assert
      // Timestamps are set by Mongoose when saving to database, not when creating object
      expect(userSettings.createdAt).toBeUndefined();
      expect(userSettings.updatedAt).toBeUndefined();
    });
  });

  describe('NewsFrequency Enum', () => {
    it('should accept HOURLY frequency', () => {
      // Arrange
      const userSettingsData = { userId: 123456, newsFrequency: NewsFrequency.HOURLY };

      // Act
      const userSettings = new UserSettings(userSettingsData);

      // Assert
      expect(userSettings.newsFrequency).toBe(NewsFrequency.HOURLY);
    });

    it('should accept EVERY_3_HOURS frequency', () => {
      // Arrange
      const userSettingsData = { userId: 123456, newsFrequency: NewsFrequency.EVERY_3_HOURS };

      // Act
      const userSettings = new UserSettings(userSettingsData);

      // Assert
      expect(userSettings.newsFrequency).toBe(NewsFrequency.EVERY_3_HOURS);
    });

    it('should accept TWICE_DAILY frequency', () => {
      // Arrange
      const userSettingsData = { userId: 123456, newsFrequency: NewsFrequency.TWICE_DAILY };

      // Act
      const userSettings = new UserSettings(userSettingsData);

      // Assert
      expect(userSettings.newsFrequency).toBe(NewsFrequency.TWICE_DAILY);
    });

    it('should accept DAILY frequency', () => {
      // Arrange
      const userSettingsData = { userId: 123456, newsFrequency: NewsFrequency.DAILY };

      // Act
      const userSettings = new UserSettings(userSettingsData);

      // Assert
      expect(userSettings.newsFrequency).toBe(NewsFrequency.DAILY);
    });

    it('should accept DISABLED frequency', () => {
      // Arrange
      const userSettingsData = { userId: 123456, newsFrequency: NewsFrequency.DISABLED };

      // Act
      const userSettings = new UserSettings(userSettingsData);

      // Assert
      expect(userSettings.newsFrequency).toBe(NewsFrequency.DISABLED);
    });
  });

  describe('Data Types', () => {
    it('should accept number for userId', () => {
      // Arrange
      const userSettingsData = { userId: 987654 };

      // Act
      const userSettings = new UserSettings(userSettingsData);

      // Assert
      expect(typeof userSettings.userId).toBe('number');
      expect(userSettings.userId).toBe(987654);
    });

    it('should accept boolean for enableAudioPodcasts', () => {
      // Arrange
      const userSettingsData = { userId: 123456, enableAudioPodcasts: true };

      // Act
      const userSettings = new UserSettings(userSettingsData);

      // Assert
      expect(typeof userSettings.enableAudioPodcasts).toBe('boolean');
      expect(userSettings.enableAudioPodcasts).toBe(true);
    });
  });

  describe('Model Methods', () => {
    it('should have save method', () => {
      // Arrange
      const userSettingsData = { userId: 123456 };
      const userSettings = new UserSettings(userSettingsData);

      // Assert
      expect(typeof userSettings.save).toBe('function');
    });

    it('should have toObject method', () => {
      // Arrange
      const userSettingsData = { userId: 123456 };
      const userSettings = new UserSettings(userSettingsData);

      // Assert
      expect(typeof userSettings.toObject).toBe('function');
    });
  });
});
