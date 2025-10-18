import { ITextToSpeechClient } from '@infrastructure/clients/ITextToSpeechClient';

// Mock implementation for testing interface compliance
class MockTextToSpeechClient implements ITextToSpeechClient {
  async generateAudio(text: string): Promise<Buffer> {
    return Buffer.from('mock audio data');
  }
}

describe('ITextToSpeechClient', () => {
  let mockClient: MockTextToSpeechClient;

  beforeEach(() => {
    mockClient = new MockTextToSpeechClient();
  });

  describe('interface compliance', () => {
    it('should implement generateAudio method', () => {
      // Assert
      expect(typeof mockClient.generateAudio).toBe('function');
    });

    it('should accept string parameter and return Promise<Buffer>', async () => {
      // Arrange
      const text = 'Test text for speech synthesis';

      // Act
      const result = await mockClient.generateAudio(text);

      // Assert
      expect(result).toBeInstanceOf(Buffer);
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('generateAudio', () => {
    it('should process text and return audio buffer', async () => {
      // Arrange
      const text = 'Hello, this is a test message for text-to-speech conversion.';

      // Act
      const result = await mockClient.generateAudio(text);

      // Assert
      expect(result).toBeInstanceOf(Buffer);
      expect(result.toString()).toBe('mock audio data');
    });

    it('should handle empty text', async () => {
      // Arrange
      const text = '';

      // Act
      const result = await mockClient.generateAudio(text);

      // Assert
      expect(result).toBeInstanceOf(Buffer);
    });

    it('should handle long text', async () => {
      // Arrange
      const text = 'A'.repeat(1000);

      // Act
      const result = await mockClient.generateAudio(text);

      // Assert
      expect(result).toBeInstanceOf(Buffer);
    });
  });
});
