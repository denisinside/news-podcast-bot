import { IArticle } from '@models/Article';
import { ITopic } from '@models/Topic';
import { IArticleRepository } from '@infrastructure/repositories/IArticleRepository';
import { ITopicRepository } from '@infrastructure/repositories/ITopicRepository';
import { INewsSourceStrategy } from '@infrastructure/strategies/INewsSourceStrategy';
import { NewsSource } from '@/types';

export class NewsFinderService {
    private articleRepository: IArticleRepository;
    private topicRepository: ITopicRepository;
    private strategies: Map<string, INewsSourceStrategy>;

    constructor(
        articleRepository: IArticleRepository,
        topicRepository: ITopicRepository
    ) {
        this.articleRepository = articleRepository;
        this.topicRepository = topicRepository;
        this.strategies = new Map();
    }

    setStrategy(sourceId: string, strategy: INewsSourceStrategy): void {
        this.strategies.set(sourceId, strategy);
    }

    async fetchAndSaveAllTopics(): Promise<void> {
        try {
            console.log('Starting news fetching process for all topics...');
            
            // Get all active topics
            const topics = await this.topicRepository.findAll();
            
            if (topics.length === 0) {
                console.log('No topics found to fetch articles for');
                return;
            }

            console.log(`Found ${topics.length} topics to process`);

            // Process each topic
            for (const topic of topics) {
                await this.fetchAndSaveArticlesForTopic(topic);
            }

            console.log('News fetching process completed for all topics');
        } catch (error) {
            console.error('Error in NewsFinderService.fetchAndSaveAllTopics:', error);
            throw new Error('Failed to fetch and save articles for all topics');
        }
    }

    private async fetchAndSaveArticlesForTopic(topic: ITopic): Promise<void> {
        try {
            console.log(`Processing topic: ${topic.name} (${topic.sourceUrl})`);

            // Find appropriate strategy for this topic
            const strategy = this.findStrategyForTopic(topic);
            if (!strategy) {
                console.log(`No strategy found for topic: ${topic.name}`);
                return;
            }

            if (!strategy.isActive()) {
                console.log(`Strategy for topic ${topic.name} is inactive`);
                return;
            }

            // Fetch articles using the strategy
            const articles = await strategy.fetch(topic.sourceUrl);
            
            if (articles.length === 0) {
                console.log(`No new articles found for topic: ${topic.name}`);
                return;
            }

            console.log(`Found ${articles.length} articles for topic: ${topic.name}`);

            // Set topicId for all articles
            const articlesWithTopicId = articles.map(article => ({
                ...article,
                topicId: topic._id as any
            }));

            // Save articles to database
            const savedArticles = await this.articleRepository.bulkInsert(articlesWithTopicId);
            
            console.log(`Saved ${savedArticles.length} new articles for topic: ${topic.name}`);
        } catch (error) {
            console.error(`Error processing topic ${topic.name}:`, error);
            // Continue with other topics even if one fails
        }
    }

    private findStrategyForTopic(topic: ITopic): INewsSourceStrategy | null {
        // For now, use the first available strategy
        // In a more sophisticated implementation, you might match strategies based on topic type or URL pattern
        const strategies = Array.from(this.strategies.values());
        return strategies.length > 0 ? strategies[0] : null;
    }

    async fetchAndSaveArticles(): Promise<void> {
        try {
            console.log('Starting news fetching process...');
            const fetchPromises = Array.from(this.strategies.entries()).map(async ([sourceId, strategy]) => {
                if (!strategy.isActive()) {
                    console.log(`Skipping inactive source: ${sourceId}`);
                    return;
                }

                try {
                    console.log(`Fetching articles from ${strategy.getSourceName()}...`);
                    const articles = await strategy.fetch(''); // URL should be provided by the strategy
                    
                    if (articles.length > 0) {
                        console.log(`Found ${articles.length} articles from ${strategy.getSourceName()}`);
                        await this.articleRepository.bulkInsert(articles);
                        console.log(`Saved ${articles.length} articles from ${strategy.getSourceName()}`);
                    } else {
                        console.log(`No new articles found from ${strategy.getSourceName()}`);
                    }
                } catch (error) {
                    console.error(`Error fetching from ${strategy.getSourceName()}:`, error);
                }
            });

            await Promise.all(fetchPromises);
            console.log('News fetching process completed');
        } catch (error) {
            console.error('Error in NewsFinderService.fetchAndSaveArticles:', error);
            throw new Error('Failed to fetch and save articles');
        }
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
