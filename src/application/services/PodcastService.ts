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
            const subscriptions = await this.subscriptionRepository.findByUserId(userId);
            
            if (subscriptions.length === 0) {
                console.error(`❌ [PodcastService] User ${userId} has no subscriptions`);
                throw new Error('User has no subscriptions');
            }

            const articles = await this.getArticlesForPodcast(subscriptions);

            if (articles.length === 0) {
                console.error(`❌ [PodcastService] No recent articles found for user ${userId} subscriptions`);
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

            const fileName = this.generatePodcastFileName(subscriptions);
            
            const fileUrl = await this.storageClient.upload(mp3Buffer, fileName);

            await this.podcastRepository.update(podcast._id as any, {
                status: 'READY',
                fileUrl
            });

            // Send podcast notification to user
            if (this.notificationService) {
                try {
                    // Get topic names for the podcast
                    const validSubscriptions = subscriptions.filter(sub => sub.topicId !== null);
                    const topicNames = validSubscriptions.map(sub => (sub.topicId as any).name || 'Невідома тема');
                    
                    const result = await this.notificationService.sendPodcastToUser(userId, fileUrl, topicNames);
                } catch (notificationError) {
                    console.error(`❌ [PodcastService] Error sending podcast notification to user ${userId}:`, notificationError);
                }
            } else {
                console.warn(`⚠️ [PodcastService] No notification service available for user ${userId}`);
            }
            
            console.log(`🎉 [PodcastService] Podcast generation completed successfully for user ${userId}`);
            return fileUrl;
        } catch (error) {
            console.error(`❌ [PodcastService] Error generating podcast for user ${userId}:`, error);
            throw error;
        }
    }

    private convertToMp3(inputBuffer: Buffer): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            
            if (!inputBuffer || inputBuffer.length === 0) {
                console.error(`❌ [PodcastService] Input buffer is empty or invalid`);
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
                    console.error(`❌ [PodcastService] FFmpeg conversion error:`, err);
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
        try {
            // Filter out subscriptions with deleted topics
            const validSubscriptions = subscriptions.filter(sub => sub.topicId !== null);
            
            const topicIds = validSubscriptions.map(sub => {
                // Handle populated topicId (object) vs non-populated (ObjectId)
                if (sub.topicId && typeof sub.topicId === 'object' && (sub.topicId as any)._id) {
                    return String((sub.topicId as any)._id);
                }
                return String(sub.topicId);
            }).filter(id => id !== 'null');
            
            // Get articles from the last 24 hours
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            
            const recentArticles = await this.articleRepository.findByDateRange(yesterday, new Date());
            
            // Filter articles by topic IDs and sort by publication date
            const filteredArticles = recentArticles
                .filter(article => {
                    const articleTopicId = (article as any).topicId?._id || (article as any).topicId;
                    const matches = topicIds.includes(String(articleTopicId));

                    return matches;
                })
                .sort((a, b) => new Date(b.publicationDate).getTime() - new Date(a.publicationDate).getTime());
            
                    
            // Distribute articles evenly across topics (max 10 articles total)
            const distributedArticles = this.distributeArticlesAcrossTopics(filteredArticles, validSubscriptions, 10);
            
            return distributedArticles;
        } catch (error) {
            console.error(`❌ [PodcastService] Error getting articles for podcast:`, error);
            throw error;
        }
    }

    private distributeArticlesAcrossTopics(articles: IArticle[], subscriptions: ISubscription[], maxArticles: number): IArticle[] {
        if (articles.length === 0) {
            return [];
        }

        // Group articles by topic
        const articlesByTopic = new Map<string, IArticle[]>();
        
        articles.forEach(article => {
            const articleTopicId = String((article as any).topicId?._id || (article as any).topicId);
            if (!articlesByTopic.has(articleTopicId)) {
                articlesByTopic.set(articleTopicId, []);
            }
            articlesByTopic.get(articleTopicId)!.push(article);
        });

        const topicCount = subscriptions.length;
        const articlesPerTopic = Math.floor(maxArticles / topicCount);
        const remainingArticles = maxArticles % topicCount;

        const selectedArticles: IArticle[] = [];
        const topicIds = subscriptions.map(sub => {
            if (sub.topicId && typeof sub.topicId === 'object' && (sub.topicId as any)._id) {
                return String((sub.topicId as any)._id);
            }
            return String(sub.topicId);
        });

        // Distribute articles evenly
        topicIds.forEach((topicId, index) => {
            const topicArticles = articlesByTopic.get(topicId) || [];
            let articlesToTake = articlesPerTopic;
            
            // Give extra articles to first few topics if there are remaining articles
            if (index < remainingArticles) {
                articlesToTake += 1;
            }

            const selectedFromTopic = topicArticles.slice(0, articlesToTake);
            selectedArticles.push(...selectedFromTopic);
        });

        // If we have fewer articles than maxArticles, try to fill with random articles from any topic
        if (selectedArticles.length < maxArticles) {
            const remainingSlots = maxArticles - selectedArticles.length;
            const allRemainingArticles = articles.filter(article => 
                !selectedArticles.some(selected => selected._id === article._id)
            );
            
            // Randomly select remaining articles
            const shuffled = allRemainingArticles.sort(() => Math.random() - 0.5);
            selectedArticles.push(...shuffled.slice(0, remainingSlots));
                    }

        // Sort final selection by publication date (newest first)
        const finalArticles = selectedArticles
            .sort((a, b) => new Date(b.publicationDate).getTime() - new Date(a.publicationDate).getTime())
            .slice(0, maxArticles);

        return finalArticles;
    }

    private async generatePodcastScript(articles: IArticle[]): Promise<string> {
        try {
            // Group articles by topic for better organization
            const articlesByTopic = new Map<string, IArticle[]>();
            
            articles.forEach(article => {
                const topicName = (article as any).topicId?.name || 'Невідома тема';
                if (!articlesByTopic.has(topicName)) {
                    articlesByTopic.set(topicName, []);
                }
                articlesByTopic.get(topicName)!.push(article);
            });

            // Create organized text by topics
            const organizedText = Array.from(articlesByTopic.entries())
                .map(([topicName, topicArticles]) => {
                    const topicText = topicArticles
                        .map(article => `Заголовок: ${article.title}\nТекст: ${article.content}\nПосилання: ${article.url}`)
                        .join('\n\n---\n\n');
                    return `ТОПІК: ${topicName}\n\n${topicText}`;
                })
                .join('\n\n==========\n\n');

            const truncatedText = organizedText.length > 15000 ? organizedText.substring(0, 15000) : organizedText;
            const topicNames = Array.from(articlesByTopic.keys()).join(', ');

            const prompt = `Ти — ведучий новинного подкасту. Створи сценарій для аудіо-дайджесту новин українською мовою на основі наданих статей.

ВАЖЛИВО: У подкасті ОБОВ'ЯЗКОВО має бути згадана хоча б одна новина з кожного з наступних топіків: ${topicNames}

Твій текст має бути лаконічним, цікавим і природним для прослуховування.

Обери випадкові голоси для першого і другого спікера (не повторюйся).

Структура випуску:
1. **Привітання:** Почни з теплого привітання, наприклад: "Вітаю, з вами щоденний подкаст новин. Давайте подивимось, що цікавого відбулось сьогодні."
2. **Основна частина:** Розкажи про найцікавіші новини з КОЖНОГО топіка. Обов'язково згадай хоча б одну новину з кожного топіка: ${topicNames}. Не просто читай, а переказуй ключові моменти своїми словами.
3. **Завершення:** Закінчи подкаст позитивним побажанням та подякою за прослуховування.

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

Ось статті для опрацювання, організовані за топіками:
---
${truncatedText}
---
`;

            const scriptJson = await this.geminiClient.generateText(prompt);            
            return scriptJson;
        } catch (error) {
            console.error(`❌ [PodcastService] Error generating podcast script:`, error);
            throw error;
        }
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
