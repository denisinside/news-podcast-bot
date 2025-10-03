export interface ITextToSpeechClient {
    generateAudio(text: string): Promise<Buffer>;
}

