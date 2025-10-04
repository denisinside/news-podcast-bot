import { IPodcast } from '@models/Podcast';
import { IArticle } from '@models/Article';
import { ISubscription } from '@models/Subscription';
import { IPodcastRepository } from '@infrastructure/repositories/IPodcastRepository';
import { IArticleRepository } from '@infrastructure/repositories/IArticleRepository';
import { ISubscriptionRepository } from '@infrastructure/repositories/ISubscriptionRepository';
import { ITextToSpeechClient } from '@infrastructure/clients/ITextToSpeechClient';
import { IFileStorageClient } from '@infrastructure/clients/IFileStorageClient';
import { Types } from 'mongoose';

export class PodcastService {
    private podcastRepository: IPodcastRepository;
    private articleRepository: IArticleRepository;
    private subscriptionRepository: ISubscriptionRepository;
    private ttsClient: ITextToSpeechClient;
    private storageClient: IFileStorageClient;

    constructor(
        podcastRepository: IPodcastRepository,
        articleRepository: IArticleRepository,
        subscriptionRepository: ISubscriptionRepository,
        ttsClient: ITextToSpeechClient,
        storageClient: IFileStorageClient
    ) {
        this.podcastRepository = podcastRepository;
        this.articleRepository = articleRepository;
        this.subscriptionRepository = subscriptionRepository;
        this.ttsClient = ttsClient;
        this.storageClient = storageClient;
    }

    async generateForUser(userId: string): Promise<string> {
        try {
            // Get user's subscriptions
            const subscriptions = await this.subscriptionRepository.findByUserId(userId);
            
            if (subscriptions.length === 0) {
                throw new Error('User has no subscriptions');
            }

            // Get topic IDs from subscriptions
            const topicIds = subscriptions.map(sub => sub.topicId);

            // Get recent articles from subscribed topics (last 24 hours)
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            
            const articles = await this.articleRepository.findByTopicIdsSince(topicIds, yesterday);

            if (articles.length === 0) {
                throw new Error('No recent articles found for user subscriptions');
            }

            // Create podcast record
            const podcast = await this.podcastRepository.create({
                userId,
                articles: articles.map(article => article._id as any)
            });

            // Generate text content for TTS
            const podcastText = this.generatePodcastText(articles);

            // Generate audio using TTS
            const audioBuffer = await this.ttsClient.generateAudio(podcastText);

            // Upload audio file to storage
            const fileName = `podcast_${userId}_${Date.now()}.mp3`;
            const fileUrl = await this.storageClient.upload(audioBuffer, fileName);

            // Update podcast with file URL
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

    private generatePodcastText(articles: IArticle[]): string {
        let text = 'Добрий день! Ось ваш щоденний дайджест новин.\n\n';

        articles.forEach((article, index) => {
            text += `${index + 1}. ${article.title}\n`;
            text += `${article.content.substring(0, 200)}...\n\n`;
        });

        text += 'Дякуємо за прослуховування!';
        return text;
    }
}
