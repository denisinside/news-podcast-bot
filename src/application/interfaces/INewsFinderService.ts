import { INewsSourceStrategy } from "@/infrastructure/strategies/INewsSourceStrategy";
import { IArticle } from "@/models/Article";
import { ITopic } from "@/models/Topic";


export interface INewsFinderService {
    fetchAndSaveAllTopics(): Promise<void>;
    fetchAndSaveArticlesForTopic(topic: ITopic): Promise<void>;
    getArticlesByKeywords(keywords: string[]): Promise<IArticle[]>;
    getArticlesByDateRange(startDate: Date, endDate: Date): Promise<IArticle[]>;
    getArticlesBySource(source: string): Promise<IArticle[]>;
    cleanupOldArticles(daysOld: number): Promise<number>;
    initAllStrategies(): Promise<void>;
}