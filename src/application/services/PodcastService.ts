import { IPodcast, PodcastStatus } from '@models/Podcast';
import { IArticle } from '@models/Article';
import { ISubscription } from '@models/Subscription';
import { IPodcastRepository } from '@infrastructure/repositories/IPodcastRepository';
import { IArticleRepository } from '@infrastructure/repositories/IArticleRepository';
import { ISubscriptionRepository } from '@infrastructure/repositories/ISubscriptionRepository';
import { IFileStorageClient } from '@infrastructure/clients/IFileStorageClient';
import { Types } from 'mongoose';
import { IGeminiClient } from '@infrastructure/clients/IGeminiClient';
import ffmpeg from 'fluent-ffmpeg';
import * as ffmpegPath from '@ffmpeg-installer/ffmpeg';
import { Readable, Writable } from 'stream';

ffmpeg.setFfmpegPath(ffmpegPath.path);

export class PodcastService {
    private podcastRepository: IPodcastRepository;
    private articleRepository: IArticleRepository;
    private subscriptionRepository: ISubscriptionRepository;
    private storageClient: IFileStorageClient;
    private geminiClient: IGeminiClient;

    constructor(
        podcastRepository: IPodcastRepository,
        articleRepository: IArticleRepository,
        subscriptionRepository: ISubscriptionRepository,
        storageClient: IFileStorageClient,
        geminiClient: IGeminiClient
    ) {
        this.podcastRepository = podcastRepository;
        this.articleRepository = articleRepository;
        this.subscriptionRepository = subscriptionRepository;
        this.storageClient = storageClient;
        this.geminiClient = geminiClient;
    }

    async generateForUser(userId: string): Promise<string> {
        try {
            const subscriptions = await this.subscriptionRepository.findByUserId(userId);
            
            if (subscriptions.length === 0) {
                throw new Error('User has no subscriptions');
            }

            const articles = await this.getArticlesForPodcast(subscriptions);

            if (articles.length === 0) {
                throw new Error('No recent articles found for user subscriptions');
            }

            const podcast = await this.podcastRepository.create({
                userId,
                articles: articles.map(article => article._id as Types.ObjectId)
            });

            await this.podcastRepository.update(podcast._id as Types.ObjectId, {
                status: PodcastStatus.GENERATING
            });

            const scriptJson = await this.generatePodcastScript(articles);
            const scriptData = JSON.parse(scriptJson);
            const { speaker1, speaker2, text } = scriptData;

            const audioBuffer = await this.geminiClient.generateAudio(speaker1, speaker2, text);

            const mp3Buffer = await this.convertToMp3(audioBuffer);

            const fileName = `podcast_${userId}_${podcast._id}.mp3`;
            const fileUrl = await this.storageClient.upload(mp3Buffer, fileName);

            await this.podcastRepository.update(podcast._id as any, {
                status: 'READY',
                fileUrl
            });

            return fileUrl;
        } catch (error) {
            console.error('Error generating podcast:', error);
            throw error;
        }
    }

    private convertToMp3(inputBuffer: Buffer): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            if (!inputBuffer || inputBuffer.length === 0) {
                reject(new Error('Input buffer is empty or invalid'));
                return;
            }

            const outputBuffers: Buffer[] = [];

            const readableStream = new Readable();
            readableStream._read = () => {};
            readableStream.push(inputBuffer);
            readableStream.push(null);

            const writableStream = new Writable({
                write(chunk, encoding, callback) {
                    outputBuffers.push(chunk);
                    callback();
                }
            });

            ffmpeg(readableStream)
                .inputFormat('s16le')
                .inputOptions([
                    '-ar 24000',
                    '-ac 1'
                ])
                .audioCodec('libmp3lame')
                .audioBitrate('128k')
                .toFormat('mp3')
                .on('error', (err) => {
                    console.error('FFmpeg conversion error:', err);
                    reject(new Error(`FFmpeg error: ${err.message}`));
                })
                .on('end', () => {
                    console.log('Audio conversion completed successfully');
                    const outputBuffer = Buffer.concat(outputBuffers);
                    resolve(outputBuffer);
                })
                .pipe(writableStream, { end: true });
        });
    }

    private async getArticlesForPodcast(subscriptions: ISubscription[]): Promise<IArticle[]> {
        const topicIds = subscriptions.map(sub => sub.topicId);
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const articles = await this.articleRepository.findByTopicIdsSince(topicIds, yesterday);
        
        return articles;
    }

    private async generatePodcastScript(articles: IArticle[]): Promise<string> {
        const combinedText = articles
            .map(article => `Заголовок: ${article.title}\nТекст: ${article.content}\nПосилання: ${article.url}\n`)
            .join('\n\n---\n\n');

        const truncatedText = combinedText.length > 15000 ? combinedText.substring(0, 15000) : combinedText;

        const prompt = `Ти — ведучий новинного подкасту. Створи сценарій для аудіо-дайджесту новин українською мовою на основі наданих статей.
        Твій текст має бути лаконічним, цікавим і природним для прослуховування.

        Обери випадкові голоси для першого і другого спікера (не повторюйся).

        Структура випуску:
        1.  **Привітання:** Почни з теплого привітання, наприклад: "Вітаю, з вами щоденний подкаст новин. Давайте подивимось, що цікавого відбулось сьогодні."
        2.  **Основна частина:** Розкажи про 2-3 найцікавіші статті. Не просто читай, а переказуй ключові моменти своїми словами.
        3.  **Завершення:** Закінчи подкаст позитивним побажанням та подякою за прослуховування.

        Як має виглядати сценарій:
        1. Налаштування атмосфери, тону голосу.
        2. Репліки спікера 1 і спікера 2 у форматі "Speaker1.name: replic"
        Приклад:
        Read aloud in a warm, welcoming tone
        Speaker 1: Hello! We're excited to show you our native speech capabilities
        Speaker 2: Where you can direct a voice, create realistic dialog, and so much more.

        Повертати результат строго у форматі JSON без зайвих символів:
        {
                type: 'object',
                required: ["speaker1", "speaker2", "text"],
                properties: {
                    speaker1: {
                    type: 'object',
                    required: ["name", "voice"],
                    properties: {
                        name: {
                        type: 'string',
                        },
                        voice: {
                        type: 'string',
                        enum: ["Zephyr", "Puck", "Charon", "Kore", "Fenrir", "Leda", "Orus", "Aoede", "Autonoe", "Enceladus", "Sulafat", "Sadachbia", "Achird"],
                        },
                    },
                    },
                    speaker2: {
                    type: 'object',
                    required: ["name", "voice"],
                    properties: {
                        name: {
                        type: 'string',
                        },
                        voice: {
                        type: 'string',
                        enum: ["Zephyr", "Puck", "Charon", "Kore", "Fenrir", "Leda", "Orus", "Aoede", "Autonoe", "Enceladus", "Sulafat", "Sadachbia", "Achird"],
                        },
                    },
                    },
                    text: {
                    type: 'string',
                    },
                },
        }
        
        Ось статті для опрацювання:
        ---
        ${truncatedText}
        ---
        `;

        return this.geminiClient.generateText(prompt);
    }
}
