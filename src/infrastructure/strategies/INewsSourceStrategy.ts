import { ITopic } from '@/models/Topic';
import { IArticle } from '@models/Article';

export interface INewsSourceStrategy {
    sourceTopic: ITopic;
    fetch(url: string): Promise<Partial<IArticle>[]>;
    getSourceName(): string;
    isActive(): boolean;
}
