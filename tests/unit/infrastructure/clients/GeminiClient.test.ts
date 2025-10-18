import { GeminiClient } from '@infrastructure/clients/GeminiClient';
import { GoogleGenAI } from '@google/genai';

// Mock the GoogleGenAI library
jest.mock('@google/genai');

describe('GeminiClient', () => {
  let geminiClient: GeminiClient;
  let mockGenAI: any;

  beforeEach(() => {
    // Create mock GoogleGenAI instance
    mockGenAI = {
      models: {
        generateContent: jest.fn(),
        generateContentStream: jest.fn()
      }
    };
    
    (GoogleGenAI as any).mockImplementation(() => mockGenAI);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should throw error when API key is not provided', () => {
      // Act & Assert
      expect(() => new GeminiClient('')).toThrow('Gemini API key is required.');
    });

    it('should create instance with valid API key', () => {
      // Arrange
      const apiKey = 'test-api-key';

      // Act
      geminiClient = new GeminiClient(apiKey);

      // Assert
      expect(GoogleGenAI).toHaveBeenCalledWith({ apiKey });
      expect(geminiClient).toBeInstanceOf(GeminiClient);
    });
  });

  describe('generateText', () => {
    beforeEach(() => {
      geminiClient = new GeminiClient('test-api-key');
    });

    it('should generate text successfully', async () => {
      // Arrange
      const prompt = 'Test prompt';
      const mockResponse = {
        candidates: [{
          content: {
            parts: [{
              text: 'Generated text response'
            }]
          }
        }]
      };
      mockGenAI.models.generateContent.mockResolvedValue(mockResponse);

      // Act
      const result = await geminiClient.generateText(prompt);

      // Assert
      expect(mockGenAI.models.generateContent).toHaveBeenCalledWith({
        model: 'gemini-2.5-flash-lite',
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: expect.objectContaining({
          temperature: 1.2,
          topP: 1,
          topK: 1,
          maxOutputTokens: 8192
        })
      });
      expect(result).toBe('Generated text response');
    });

    it('should handle response with JSON formatting', async () => {
      // Arrange
      const prompt = 'Test prompt';
      const mockResponse = {
        candidates: [{
          content: {
            parts: [{
              text: '```json\n{"result": "test"}\n```'
            }]
          }
        }]
      };
      mockGenAI.models.generateContent.mockResolvedValue(mockResponse);

      // Act
      const result = await geminiClient.generateText(prompt);

      // Assert
      // The actual behavior removes ```json and ``` but keeps newlines
      expect(result).toBe('\n{"result": "test"}\n');
    });

    it('should throw error when response is invalid', async () => {
      // Arrange
      const prompt = 'Test prompt';
      const mockResponse = {
        candidates: [{}]
      };
      mockGenAI.models.generateContent.mockResolvedValue(mockResponse);

      // Act & Assert
      await expect(geminiClient.generateText(prompt)).rejects.toThrow(
        'Failed to generate text with Gemini API.'
      );
    });

    it('should throw error when API call fails', async () => {
      // Arrange
      const prompt = 'Test prompt';
      mockGenAI.models.generateContent.mockRejectedValue(new Error('API Error'));

      // Act & Assert
      await expect(geminiClient.generateText(prompt)).rejects.toThrow(
        'Failed to generate text with Gemini API.'
      );
    });
  });

  describe('generateAudio', () => {
    beforeEach(() => {
      geminiClient = new GeminiClient('test-api-key');
    });

    it('should generate audio successfully', async () => {
      // Arrange
      const speaker1 = { name: 'Speaker1', voice: 'voice1' };
      const speaker2 = { name: 'Speaker2', voice: 'voice2' };
      const text = 'Test text for audio generation';
      
      const mockChunk1 = {
        candidates: [{
          content: {
            parts: [{
              inlineData: {
                data: Buffer.from('audio1').toString('base64')
              }
            }]
          }
        }]
      };
      
      const mockChunk2 = {
        candidates: [{
          content: {
            parts: [{
              inlineData: {
                data: Buffer.from('audio2').toString('base64')
              }
            }]
          }
        }]
      };

      const mockStream = {
        [Symbol.asyncIterator]: async function* () {
          yield mockChunk1;
          yield mockChunk2;
        }
      };

      mockGenAI.models.generateContentStream.mockReturnValue(mockStream);

      // Act
      const result = await geminiClient.generateAudio(speaker1, speaker2, text);

      // Assert
      expect(mockGenAI.models.generateContentStream).toHaveBeenCalledWith({
        model: 'gemini-2.5-flash-preview-tts',
        config: {
          temperature: 1,
          responseModalities: ['audio'],
          speechConfig: {
            multiSpeakerVoiceConfig: {
              speakerVoiceConfigs: [
                {
                  speaker: speaker1.name,
                  voiceConfig: {
                    prebuiltVoiceConfig: {
                      voiceName: speaker1.voice
                    }
                  }
                },
                {
                  speaker: speaker2.name,
                  voiceConfig: {
                    prebuiltVoiceConfig: {
                      voiceName: speaker2.voice
                    }
                  }
                }
              ]
            }
          }
        },
        contents: [{
          role: 'user',
          parts: [{ text }]
        }]
      });
      expect(result).toBeInstanceOf(Buffer);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should throw error when no audio data received', async () => {
      // Arrange
      const speaker1 = { name: 'Speaker1', voice: 'voice1' };
      const speaker2 = { name: 'Speaker2', voice: 'voice2' };
      const text = 'Test text';
      
      const mockStream = {
        [Symbol.asyncIterator]: async function* () {
          // Empty stream
        }
      };

      mockGenAI.models.generateContentStream.mockReturnValue(mockStream);

      // Act & Assert
      await expect(geminiClient.generateAudio(speaker1, speaker2, text)).rejects.toThrow(
        'Audio generation failed, no audio data received.'
      );
    });

    it('should handle chunks without audio data', async () => {
      // Arrange
      const speaker1 = { name: 'Speaker1', voice: 'voice1' };
      const speaker2 = { name: 'Speaker2', voice: 'voice2' };
      const text = 'Test text';
      
      const mockChunk = {
        candidates: [{
          content: {
            parts: [{}] // No inlineData
          }
        }]
      };

      const mockStream = {
        [Symbol.asyncIterator]: async function* () {
          yield mockChunk;
        }
      };

      mockGenAI.models.generateContentStream.mockReturnValue(mockStream);

      // Act & Assert
      await expect(geminiClient.generateAudio(speaker1, speaker2, text)).rejects.toThrow(
        'Audio generation failed, no audio data received.'
      );
    });
  });
});