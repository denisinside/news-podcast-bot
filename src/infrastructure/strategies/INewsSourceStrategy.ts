import { IArticle } from '@models/Article';

export interface INewsSourceStrategy {
    fetch(url: string): Promise<Partial<IArticle>[]>;
    getSourceName(): string;
    isActive(): boolean;
}
