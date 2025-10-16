import { INotificationService } from "../interfaces/INotificationService";
import { IMessageTemplateService } from "../interfaces/IMessageTemplateService";
import { ISubscriptionRepository } from "@/infrastructure/repositories/ISubscriptionRepository";
import { IArticle } from "@/models";
import { Telegraf } from "telegraf";
import { IBotContext } from "@/context/IBotContext";
import { IPodcastService } from "../interfaces/IPodcastService";

export class NotificationService implements INotificationService {
    private bot: Telegraf<IBotContext>;
    private subscriptionRepository: ISubscriptionRepository;
    public messageTemplateService: IMessageTemplateService;
    public podcastService?: IPodcastService;

    constructor(
        bot: Telegraf<IBotContext>,
        subscriptionRepository: ISubscriptionRepository,
        messageTemplateService: IMessageTemplateService
    ) {
        this.bot = bot;
        this.subscriptionRepository = subscriptionRepository;
        this.messageTemplateService = messageTemplateService;
    }

    setPodcastService(podcastService: IPodcastService): void {
        this.podcastService = podcastService;
    }

    async sendNewsToSubscribers(topicId: string, article: IArticle): Promise<{
        sent: number;
        failed: number;
        errors: string[];
    }> {
        try {
            // Get all subscriptions for this topic
            const subscriptions = await this.subscriptionRepository.findByTopicId(topicId);
            
            if (subscriptions.length === 0) {
                console.log(`No subscribers found for topic ${topicId}`);
                return { sent: 0, failed: 0, errors: [] };
            }

            // Get topic name from article (assuming it's populated)
            const topicName = (article as any).topicId?.name || 'Невідома тема';
            
            // Format the message
            const message = this.messageTemplateService.formatNewsNotification(article, topicName);
            
            // Send to all subscribers
            const userIds = subscriptions.map(sub => sub.userId);
            return await this.sendBulkMessages(userIds, message);

        } catch (error) {
            console.error('Error sending news to subscribers:', error);
            return { 
                sent: 0, 
                failed: 0, 
                errors: [`Failed to send news: ${error}`] 
            };
        }
    }

    async sendPodcastToUser(userId: string, podcastUrl: string, topics: string[]): Promise<{
        success: boolean;
        error?: string;
    }> {
        try {
            const message = this.messageTemplateService.formatPodcastNotification(podcastUrl, topics);
            
            const result = await this.sendMessage(userId, message, 'Markdown');
            return result;

        } catch (error) {
            console.error(`Error sending podcast to user ${userId}:`, error);
            return { 
                success: false, 
                error: `Failed to send podcast: ${error}` 
            };
        }
    }

    async sendBulkMessages(userIds: string[], message: string): Promise<{
        sent: number;
        failed: number;
        errors: string[];
    }> {
        let sent = 0;
        let failed = 0;
        const errors: string[] = [];

        console.log(`Sending bulk message to ${userIds.length} users`);

        for (const userId of userIds) {
            try {
                const result = await this.sendMessage(userId, message, 'Markdown');
                
                if (result.success) {
                    sent++;
                } else {
                    failed++;
                    errors.push(`User ${userId}: ${result.error}`);
                }

                // Rate limiting - wait 50ms between messages
                await new Promise(resolve => setTimeout(resolve, 50));

            } catch (error) {
                failed++;
                errors.push(`User ${userId}: ${error}`);
                console.error(`Error sending message to user ${userId}:`, error);
            }
        }

        console.log(`Bulk message completed: ${sent} sent, ${failed} failed`);
        return { sent, failed, errors };
    }

    async sendMessage(userId: string, message: string, parseMode: 'Markdown' | 'HTML' = 'Markdown'): Promise<{
        success: boolean;
        error?: string;
    }> {
        try {
            await this.bot.telegram.sendMessage(userId, message, {
                parse_mode: parseMode,
                link_preview_options: { is_disabled: true }
            });

            return { success: true };

        } catch (error: any) {
            // Handle specific Telegram errors
            if (error.code === 403) {
                return { 
                    success: false, 
                    error: 'User blocked the bot' 
                };
            } else if (error.code === 400) {
                return { 
                    success: false, 
                    error: 'Invalid user ID or message format' 
                };
            } else if (error.code === 429) {
                // Rate limit exceeded, wait and retry once
                await new Promise(resolve => setTimeout(resolve, 1000));
                try {
                    await this.bot.telegram.sendMessage(userId, message, {
                        parse_mode: parseMode,
                        link_preview_options: { is_disabled: true }
                    });
                    return { success: true };
                } catch (retryError) {
                    return { 
                        success: false, 
                        error: 'Rate limit exceeded' 
                    };
                }
            }

            return { 
                success: false, 
                error: error.message || 'Unknown error' 
            };
        }
    }
}
