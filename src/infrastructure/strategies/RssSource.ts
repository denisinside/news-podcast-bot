import { ITopic } from '@/models/Topic';
import { INewsSourceStrategy } from './INewsSourceStrategy';
import { IArticle } from '@models/Article';
import { Types } from 'mongoose';

export class RssSource implements INewsSourceStrategy {
    sourceTopic: ITopic;
    private isActiveFlag: boolean;

    constructor(sourceTopic: ITopic, isActive: boolean = true) {
        this.sourceTopic = sourceTopic;
        this.isActiveFlag = isActive;
    }

    async fetch(url: string): Promise<Partial<IArticle>[]> {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Failed to fetch RSS feed: ${response.statusText}`);
            }

            const json = await response.json();
            return this.parseRSS(json);
        } catch (error) {
            console.error(`Error fetching RSS from ${url}:`, error);
            return [];
        }
    }

    parseRSS(json: any): Partial<IArticle>[] {
        return json.items.map((item: any) => {
            return {
                title: item.title,
                url: item.url || item.link,
                content: item.content_text,
                publicationDate: item.date_published,
                image_url: item.image || null,
                source: item.url,
                topicId: this.sourceTopic._id
            };
        });
    }

    getSourceName(): string {
        return this.sourceTopic.name;
    }

    isActive(): boolean {
        return this.isActiveFlag;
    }

    setActive(active: boolean): void {
        this.isActiveFlag = active;
    }
}