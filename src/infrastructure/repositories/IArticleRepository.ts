import { IArticle } from '@models/Article';
import { Types } from 'mongoose';

export interface IArticleRepository {
    create(article: Partial<IArticle>): Promise<IArticle>;
    findByUrl(url: string): Promise<IArticle | null>;
    findByTopicIdsSince(topicIds: Types.ObjectId[], date: Date): Promise<IArticle[]>;
    findById(id: string): Promise<IArticle | null>;
    findAll(): Promise<IArticle[]>;
    update(id: string, updateData: Partial<IArticle>): Promise<IArticle | null>;
    delete(id: string): Promise<boolean>;
    bulkInsert(articles: Partial<IArticle>[]): Promise<IArticle[]>;
    findByDateRange(startDate: Date, endDate: Date): Promise<IArticle[]>;
    findBySource(source: string): Promise<IArticle[]>;
    findByUserId(userId: string, sinceDate?: Date, untilDate?: Date): Promise<IArticle[]>;
    cleanupOldArticles(daysOld?: number): Promise<number>;
}
