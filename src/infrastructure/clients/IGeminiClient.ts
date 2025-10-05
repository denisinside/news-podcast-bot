export interface IGeminiClient {
    generateText(prompt: string): Promise<string>;
    generateAudio(speaker1: Speaker, speaker2: Speaker, text: string): Promise<Buffer>;
}

export interface Speaker {
    name: string;
    voice: string;
}