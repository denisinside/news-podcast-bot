import { INewsSourceStrategy } from './INewsSourceStrategy';
import { IArticle } from '@models/Article';
import { Types } from 'mongoose';

export class RssSource implements INewsSourceStrategy {
    private sourceName: string;
    private isActiveFlag: boolean;

    constructor(sourceName: string, isActive: boolean = true) {
        this.sourceName = sourceName;
        this.isActiveFlag = isActive;
    }

    async fetch(url: string): Promise<Partial<IArticle>[]> {
        try {
            // This is a basic RSS parser implementation
            // In a real implementation, you would use a proper RSS parser library
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Failed to fetch RSS feed: ${response.statusText}`);
            }

            const xmlText = await response.text();
            return this.parseRSS(xmlText);
        } catch (error) {
            console.error(`Error fetching RSS from ${url}:`, error);
            return [];
        }
    }

    private parseRSS(xmlText: string): Partial<IArticle>[] {
        // Basic RSS parsing - in production, use a proper XML/RSS parser
        const articles: Partial<IArticle>[] = [];
        
        // Simple regex-based parsing for demonstration
        // In production, use xml2js or similar library
        const itemRegex = /<item[^>]*>([\s\S]*?)<\/item>/gi;
        let match;

        while ((match = itemRegex.exec(xmlText)) !== null) {
            const itemContent = match[1];
            
            const title = this.extractTag(itemContent, 'title');
            const link = this.extractTag(itemContent, 'link');
            const description = this.extractTag(itemContent, 'description');
            const pubDate = this.extractTag(itemContent, 'pubDate');

            if (title && link && description) {
                articles.push({
                    title: this.cleanText(title),
                    url: this.cleanText(link),
                    content: this.cleanText(description),
                    publicationDate: pubDate ? new Date(pubDate) : new Date(),
                    source: this.sourceName,
                    topicId: new Types.ObjectId() // This should be set by the service
                });
            }
        }

        return articles;
    }

    private extractTag(content: string, tagName: string): string | null {
        const regex = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\/${tagName}>`, 'i');
        const match = content.match(regex);
        return match ? match[1].trim() : null;
    }

    private cleanText(text: string): string {
        return text
            .replace(/<[^>]*>/g, '') // Remove HTML tags
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&amp;/g, '&')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .trim();
    }

    getSourceName(): string {
        return this.sourceName;
    }

    isActive(): boolean {
        return this.isActiveFlag;
    }

    setActive(active: boolean): void {
        this.isActiveFlag = active;
    }
}

