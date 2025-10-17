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
import { INotificationService } from '../interfaces/INotificationService';

ffmpeg.setFfmpegPath(ffmpegPath.path);

export class PodcastService {
    private podcastRepository: IPodcastRepository;
    private articleRepository: IArticleRepository;
    private subscriptionRepository: ISubscriptionRepository;
    private storageClient: IFileStorageClient;
    private geminiClient: IGeminiClient;
    private notificationService?: INotificationService;

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

    setNotificationService(notificationService: INotificationService): void {
        this.notificationService = notificationService;
    }

    async generateForUser(userId: string): Promise<string> {
        try {
            console.log(`🎙️ [PodcastService] Starting podcast generation for user ${userId}`);
            
            const subscriptions = await this.subscriptionRepository.findByUserId(userId);
            console.log(`📋 [PodcastService] Found ${subscriptions.length} subscriptions for user`);
            
            if (subscriptions.length === 0) {
                throw new Error('User has no subscriptions');
            }

            const articles = await this.getArticlesForPodcast(subscriptions);
            console.log(`📰 [PodcastService] Found ${articles.length} articles for podcast`);

            if (articles.length === 0) {
                throw new Error('No recent articles found for user subscriptions');
            }

            console.log(`💾 [PodcastService] Creating podcast record in database`);
            const podcast = await this.podcastRepository.create({
                userId,
                articles: articles.map(article => article._id as Types.ObjectId)
            });

            await this.podcastRepository.update(podcast._id as Types.ObjectId, {
                status: PodcastStatus.GENERATING
            });

            console.log(`📝 [PodcastService] Generating podcast script with Gemini`);
            const scriptJson = await this.generatePodcastScript(articles);
            const scriptData = JSON.parse(scriptJson);
            const { speaker1, speaker2, text } = scriptData;
            console.log(`🎭 [PodcastService] Script generated with speakers: ${speaker1.name} (${speaker1.voice}) & ${speaker2.name} (${speaker2.voice})`);

            console.log(`🎵 [PodcastService] Generating audio with Gemini TTS`);
            const audioBuffer = await this.geminiClient.generateAudio(speaker1, speaker2, text);
            console.log(`🔊 [PodcastService] Audio generated, buffer size: ${audioBuffer.length} bytes`);

            console.log(`🔄 [PodcastService] Converting audio to MP3 format`);
            const mp3Buffer = await this.convertToMp3(audioBuffer);
            console.log(`🎧 [PodcastService] MP3 conversion completed, buffer size: ${mp3Buffer.length} bytes`);

            // Generate descriptive filename
            const fileName = this.generatePodcastFileName(subscriptions);
            const fileUrl = await this.storageClient.upload(mp3Buffer, fileName);
            console.log(`📁 [PodcastService] File uploaded successfully: ${fileUrl}`);

            await this.podcastRepository.update(podcast._id as any, {
                status: 'READY',
                fileUrl
            });
            console.log(`✅ [PodcastService] Podcast record updated with file URL`);

            // Send podcast notification to user
            if (this.notificationService) {
                try {
                    console.log(`📤 [PodcastService] Sending podcast notification to user`);
                    // Get topic names for the podcast
                    const validSubscriptions = subscriptions.filter(sub => sub.topicId !== null);
                    const topicNames = validSubscriptions.map(sub => (sub.topicId as any).name || 'Невідома тема');
                    
                    const result = await this.notificationService.sendPodcastToUser(userId, fileUrl, topicNames);
                    
                    if (result.success) {
                        console.log(`✅ [PodcastService] Podcast notification sent successfully to user ${userId}`);
                    } else {
                        console.warn(`⚠️ [PodcastService] Failed to send podcast notification to user ${userId}: ${result.error}`);
                    }
                } catch (notificationError) {
                    console.error(`❌ [PodcastService] Error sending podcast notification to user ${userId}:`, notificationError);
                }
            }

            console.log(`🎉 [PodcastService] Podcast generation completed successfully for user ${userId}`);
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
                    const outputBuffer = Buffer.concat(outputBuffers);
                    resolve(outputBuffer);
                })
                .pipe(writableStream, { end: true });
        });
    }

    private async getArticlesForPodcast(subscriptions: ISubscription[]): Promise<IArticle[]> {
        // Filter out subscriptions with deleted topics
        const validSubscriptions = subscriptions.filter(sub => sub.topicId !== null);
        const topicIds = validSubscriptions.map(sub => {
            // Handle populated topicId (object) vs non-populated (ObjectId)
            if (sub.topicId && typeof sub.topicId === 'object' && (sub.topicId as any)._id) {
                return String((sub.topicId as any)._id);
            }
            return String(sub.topicId);
        }).filter(id => id !== 'null');
        
        console.log(`PodcastService: Looking for articles for ${topicIds.length} topics:`, topicIds);
        
        // Use the same approach as AdminUsersScene - get all articles and filter by topic
        const allArticles = await this.articleRepository.findAll();
        console.log(`PodcastService: Found ${allArticles.length} total articles in database`);
        
        // Filter articles by topic IDs and sort by publication date
        const filteredArticles = allArticles
            .filter(article => {
                const articleTopicId = (article as any).topicId?._id || (article as any).topicId;
                const matches = topicIds.includes(String(articleTopicId));
                if (matches) {
                    console.log(`PodcastService: Found matching article: ${article.title} (Topic: ${articleTopicId})`);
                }
                return matches;
            })
            .sort((a, b) => new Date(b.publicationDate).getTime() - new Date(a.publicationDate).getTime())
            .slice(0, 10); // Limit to 10 most recent articles
        
        console.log(`PodcastService: Filtered to ${filteredArticles.length} articles for podcast`);
        return filteredArticles;
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

    private generatePodcastFileName(subscriptions: ISubscription[]): string {
        // Get current date in YYYY-MM-DD format
        const now = new Date();
        const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
        
        // Get topic names from subscriptions
        const validSubscriptions = subscriptions.filter(sub => sub.topicId !== null);
        const topicNames = validSubscriptions.map(sub => {
            if (typeof sub.topicId === 'object' && sub.topicId !== null) {
                return (sub.topicId as any).name || 'невідома-тема';
            }
            return 'невідома-тема';
        });
        
        // Clean topic names for filename (remove special characters, spaces)
        const cleanTopicNames = topicNames.map(name => 
            name.toLowerCase()
                .replace(/[^а-яa-z0-9]/g, '-')
                .replace(/-+/g, '-')
                .replace(/^-|-$/g, '')
        );
        
        // Join topics with hyphens
        const topicsStr = cleanTopicNames.join('-');
        
        // Generate filename
        const fileName = `podcast_${dateStr}_${topicsStr}.mp3`;
        
        console.log('Generated podcast filename:', fileName);
        return fileName;
    }
}
