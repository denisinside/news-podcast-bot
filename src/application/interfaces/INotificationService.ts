import { IArticle } from "@/models";
import { IMessageTemplateService } from "./IMessageTemplateService";
import { IPodcastService } from "./IPodcastService";

export interface INotificationService {
    /**
     * Sends a news article to all subscribers of a specific topic
     * @param topicId - ID of the topic
     * @param article - Article to send
     * @returns Promise with delivery statistics
     */
    sendNewsToSubscribers(topicId: string, article: IArticle): Promise<{
        sent: number;
        failed: number;
        errors: string[];
    }>;

    /**
     * Sends a podcast to a specific user
     * @param userId - Telegram user ID
     * @param podcastUrl - URL to the podcast file
     * @param topics - Topics included in the podcast
     * @returns Promise with delivery result
     */
    sendPodcastToUser(userId: string, podcastUrl: string, topics: string[]): Promise<{
        success: boolean;
        error?: string;
    }>;

    /**
     * Sends a message to multiple users
     * @param userIds - Array of Telegram user IDs
     * @param message - Message text to send
     * @returns Promise with delivery statistics
     */
    sendBulkMessages(userIds: string[], message: string): Promise<{
        sent: number;
        failed: number;
        errors: string[];
    }>;

    /**
     * Sends a single message to a user
     * @param userId - Telegram user ID
     * @param message - Message text to send
     * @param parseMode - Optional parse mode (Markdown, HTML)
     * @returns Promise with delivery result
     */
    sendMessage(userId: string, message: string, parseMode?: 'Markdown' | 'HTML'): Promise<{
        success: boolean;
        error?: string;
    }>;

    /**
     * Sends a message with optional media (image) and article URL button
     * @param userId - Telegram user ID
     * @param message - Message text to send
     * @param imageUrl - Optional image URL to attach
     * @param articleUrl - Optional article URL for button
     * @returns Promise with delivery result
     */
    sendMessageWithMedia(userId: string, message: string, imageUrl?: string, articleUrl?: string): Promise<{
        success: boolean;
        error?: string;
    }>;

    // Internal services access
    messageTemplateService: IMessageTemplateService;
    podcastService?: IPodcastService;
}
