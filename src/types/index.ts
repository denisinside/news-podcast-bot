import { Context } from 'telegraf';

export interface BotContext extends Context {
    session?: {
        user?: {
            id: number;
            username?: string;
            firstName?: string;
            lastName?: string;
        };
    };
}

export interface NewsSource {
    id: string;
    name: string;
    url: string;
    type: 'rss' | 'api';
    isActive: boolean;
    keywords?: string[];
}

export interface RSSItem {
    title: string;
    link: string;
    content: string;
    pubDate: string;
    category?: string;
}
