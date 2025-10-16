import { IArticle } from '@models/Article';
import { ITopic } from '@models/Topic';
import { IArticleRepository } from '@infrastructure/repositories/IArticleRepository';
import { ITopicRepository } from '@infrastructure/repositories/ITopicRepository';
import { INewsSourceStrategy } from '@infrastructure/strategies/INewsSourceStrategy';
import { NewsSource } from '@/types';
import { INewsFinderService } from '../interfaces/INewsFinderService';
import { RssSource } from '@/infrastructure/strategies/RssSource';
import { INotificationService } from '../interfaces/INotificationService';

export class NewsFinderService implements INewsFinderService {
    private articleRepository: IArticleRepository;
    private topicRepository: ITopicRepository;
    private strategies: Map<string, INewsSourceStrategy>;
    private notificationService?: INotificationService;

    constructor(
        articleRepository: IArticleRepository,
        topicRepository: ITopicRepository
    ) {
        this.articleRepository = articleRepository;
        this.topicRepository = topicRepository;
        this.strategies = new Map();
        this.initAllStrategies();
    }

    setNotificationService(notificationService: INotificationService): void {
        this.notificationService = notificationService;
    }

    setStrategy(sourceId: string, strategy: INewsSourceStrategy): void {
        this.strategies.set(sourceId, strategy);
    }

    async fetchAndSaveAllTopics(): Promise<void> {
        try {
            console.log('Starting news fetching process for all topics...');

            const topics = await this.topicRepository.findAll();

            if (topics.length === 0) {
                console.log('No topics found to fetch articles for');
                return;
            }

            for (const topic of topics) {
                await this.fetchAndSaveArticlesForTopic(topic);
            }

            console.log('News fetching process completed for all topics');
        } catch (error) {
            console.error('Error in NewsFinderService.fetchAndSaveAllTopics:', error);
            throw new Error('Failed to fetch and save articles for all topics');
        }
    }

    async fetchAndSaveArticlesForTopic(topic: ITopic): Promise<void> {
        try {
            const strategy = this.findStrategyForTopic(topic);
            if (!strategy) {
                console.log(`No strategy found for topic: ${topic.name}`);
                return;
            }

            if (!strategy.isActive()) {
                console.log(`Strategy for topic ${topic.name} is inactive`);
                return;
            }

            const articles = await strategy.fetch(topic.sourceUrl);

            if (articles.length === 0) {
                console.log(`No new articles found for topic: ${topic.name}`);
                return;
            }

            const savedArticles = await this.articleRepository.bulkInsert(articles);

            console.log(`Saved ${savedArticles.length} new articles for topic: ${topic.name}`);

            // Send notifications to subscribers for each new article
            if (this.notificationService && savedArticles.length > 0) {
                console.log(`Sending notifications for ${savedArticles.length} new articles in topic: ${topic.name}`);

                for (const article of savedArticles) {
                    try {
                        const result = await this.notificationService.sendNewsToSubscribers(topic.id, article);
                        console.log(`News notification sent: ${result.sent} users, ${result.failed} failed`);

                        if (result.errors.length > 0) {
                            console.warn('Notification errors:', result.errors);
                        }
                    } catch (notificationError) {
                        console.error(`Failed to send notification for article ${article._id}:`, notificationError);
                    }
                }
            }
        } catch (error) {
            console.error(`Error processing topic ${topic.name}:`, error);
        }
    }

    private findStrategyForTopic(topic: ITopic): INewsSourceStrategy | null {
        return Array.from(this.strategies.values()).find(strategy => strategy.sourceTopic.id === topic.id) || null;
    }

    async getArticlesByKeywords(keywords: string[]): Promise<IArticle[]> {
        try {
            const allArticles = await this.articleRepository.findAll();
            return allArticles.filter(article =>
                keywords.some(keyword =>
                    article.title.toLowerCase().includes(keyword.toLowerCase()) ||
                    article.content.toLowerCase().includes(keyword.toLowerCase())
                )
            );
        } catch (error) {
            console.error('Error getting articles by keywords:', error);
            return [];
        }
    }

    async getArticlesByDateRange(startDate: Date, endDate: Date): Promise<IArticle[]> {
        return await this.articleRepository.findByDateRange(startDate, endDate);
    }

    async getArticlesBySource(source: string): Promise<IArticle[]> {
        return await this.articleRepository.findBySource(source);
    }

    async cleanupOldArticles(daysOld: number = 30): Promise<number> {
        return await this.articleRepository.cleanupOldArticles(daysOld);
    }

    async initAllStrategies(): Promise<void> {
        const topics = await this.topicRepository.findAll();
        for (const topic of topics) {
            const strategy = new RssSource(topic);
            this.strategies.set(topic.sourceUrl, strategy);
        }
    }

    addNewsSource(source: NewsSource, strategy: INewsSourceStrategy): void {
        this.strategies.set(source.id, strategy);
    }

    removeNewsSource(sourceId: string): void {
        this.strategies.delete(sourceId);
    }

    getActiveSources(): string[] {
        return Array.from(this.strategies.entries())
            .filter(([_, strategy]) => strategy.isActive())
            .map(([sourceId, _]) => sourceId);
    }
}
