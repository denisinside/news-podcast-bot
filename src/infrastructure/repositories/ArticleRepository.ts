import { Article, IArticle } from '@models/Article';
import { IArticleRepository } from './IArticleRepository';

export class ArticleRepository implements IArticleRepository {
    async create(article: Partial<IArticle>): Promise<IArticle> {
        const newArticle = new Article(article);
        return await newArticle.save();
    }

    async findByUrl(url: string): Promise<IArticle | null> {
        return await Article.findOne({ url });
    }

    async findByTopicIdsSince(topicIds: any[], date: Date): Promise<IArticle[]> {
        return await Article.find({
            topicId: { $in: topicIds },
            publicationDate: { $gte: date }
        }).populate('topicId').sort({ publicationDate: -1 });
    }

    async findById(id: string): Promise<IArticle | null> {
        return await Article.findById(id);
    }

    async findAll(): Promise<IArticle[]> {
        return await Article.find().populate('topicId').sort({ publicationDate: -1 });
    }

    async update(id: string, updateData: Partial<IArticle>): Promise<IArticle | null> {
        return await Article.findByIdAndUpdate(id, updateData, { new: true });
    }

    async delete(id: string): Promise<boolean> {
        const result = await Article.findByIdAndDelete(id);
        return result !== null;
    }

    async bulkInsert(articles: Partial<IArticle>[]): Promise<IArticle[]> {
        const existingUrls = await Article.find({
            url: { $in: articles.map(article => article.url) }
        }).distinct('url');

        const newArticles = articles.filter(article => 
            article.url && !existingUrls.includes(article.url)
        );

        if (newArticles.length === 0) {
            return [];
        }

        return await Article.insertMany(newArticles) as IArticle[];
    }

    async findByDateRange(startDate: Date, endDate: Date): Promise<IArticle[]> {
        return await Article.find({
            publicationDate: {
                $gte: startDate,
                $lte: endDate
            }
        }).populate('topicId').sort({ publicationDate: -1 });
    }

    async findBySource(source: string): Promise<IArticle[]> {
        return await Article.find({ source }).populate('topicId').sort({ publicationDate: -1 });
    }

    async cleanupOldArticles(daysOld: number = 30): Promise<number> {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysOld);

        const result = await Article.deleteMany({
            publicationDate: { $lt: cutoffDate }
        });

        return result.deletedCount || 0;
    }
}
