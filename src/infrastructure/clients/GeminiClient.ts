import { GoogleGenAI, Type, HarmCategory, HarmBlockThreshold } from '@google/genai';
import { IGeminiClient, Speaker } from './IGeminiClient';

export class GeminiClient implements IGeminiClient {
    private genAI;
    private textModel;
    private modelTTS;

    constructor(apiKey: string) {
        if (!apiKey) {
            throw new Error('Gemini API key is required.');
        }
        this.genAI = new GoogleGenAI({apiKey});
        this.textModel = 'gemini-flash-latest';
        this.modelTTS = 'gemini-2.5-flash-preview-tts';
    }

    async generateText(prompt: string): Promise<string> {
        try {
            const generationConfig = {
                temperature: 1.2,
                topP: 1,
                topK: 1,
                maxOutputTokens: 8192,
                safetySettings: [
                    { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
                    { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
                    { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
                    { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
                ],
                tools: [
                    { urlContext: {} },
                ],
                thinkingConfig: {
                  thinkingBudget: -1,
                }
            };

            const response = await this.genAI.models.generateContent({
                model: this.textModel,
                contents: [{ role: "user", parts: [{ text: prompt }] }],
                config: generationConfig
            });
            if (!response || !response.candidates || !response.candidates[0]?.content || !response.candidates[0].content.parts || !response.candidates[0].content.parts[0].text) {
                throw new Error('Failed to generate text with Gemini API.');
            }
            const text = response.candidates[0].content.parts[0].text.replace(/```json/g, '').replace(/```/g, '');
            console.log('response', text);
            return text;
        } catch (error) {
            console.error('Error generating text with Gemini:', error);
            throw new Error('Failed to generate text with Gemini API.');
        }
    }

    async generateAudio(speaker1: Speaker, speaker2: Speaker, text: string): Promise<Buffer> {
        const config = {
            temperature: 1,
            responseModalities: [
                'audio',
            ],
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
                  },
                ]
              },
            },
          };
          const contents = [
            {
              role: 'user',
              parts: [
                {
                  text: text
                },
              ],
            },
          ];
        
          const response = await this.genAI.models.generateContentStream({
            model: this.modelTTS,
            config: config,
            contents,
          });
          
          const audioBuffers: Buffer[] = [];

          for await (const chunk of response) {
            if (chunk.candidates?.[0]?.content?.parts?.[0]?.inlineData) {
                const inlineData = chunk.candidates[0].content.parts[0].inlineData;
                const buffer = Buffer.from(inlineData.data || '', 'base64');
                audioBuffers.push(buffer);
            }
          }

          if (audioBuffers.length === 0) {
            throw new Error('Audio generation failed, no audio data received.');
          }

          return Buffer.concat(audioBuffers);
    }
  }