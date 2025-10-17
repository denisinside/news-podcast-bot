import { IArticle } from "@/models";

export interface IMessageTemplateService {
    /**
     * Formats a news article into a Telegram message
     * @param article - The article to format
     * @param topicName - Name of the topic the article belongs to
     * @returns Object with formatted message text, optional image URL and article URL
     */
    formatNewsNotification(article: IArticle, topicName: string): { text: string; imageUrl?: string; url?: string };

    /**
     * Formats a podcast notification message
     * @param podcastUrl - URL to the podcast file
     * @param topics - Array of topic names included in the podcast
     * @param duration - Optional duration of the podcast
     * @returns Formatted message text in Markdown
     */
    formatPodcastNotification(podcastUrl: string, topics: string[], duration?: string): string;

    /**
     * Formats an error notification message
     * @param error - Error message to display
     * @returns Formatted message text in Markdown
     */
    formatErrorNotification(error: string): string;

    /**
     * Truncates text to fit Telegram message limits
     * @param text - Text to truncate
     * @param maxLength - Maximum allowed length (default: 4000)
     * @returns Truncated text with ellipsis if needed
     */
    truncateText(text: string, maxLength?: number): string;
}
