import { INotificationService } from "../interfaces/INotificationService";
import { IMessageTemplateService } from "../interfaces/IMessageTemplateService";
import { ISubscriptionRepository } from "@/infrastructure/repositories/ISubscriptionRepository";
import { ITopicRepository } from "@/infrastructure/repositories/ITopicRepository";
import { IArticle } from "@/models";
import { Telegraf, Input } from "telegraf";
import { IBotContext } from "@/context/IBotContext";
import { IPodcastService } from "../interfaces/IPodcastService";

export class NotificationService implements INotificationService {
    private bot: Telegraf<IBotContext>;
    private subscriptionRepository: ISubscriptionRepository;
    private topicRepository: ITopicRepository;
    public messageTemplateService: IMessageTemplateService;
    public podcastService?: IPodcastService;

    constructor(
        bot: Telegraf<IBotContext>,
        subscriptionRepository: ISubscriptionRepository,
        topicRepository: ITopicRepository,
        messageTemplateService: IMessageTemplateService
    ) {
        this.bot = bot;
        this.subscriptionRepository = subscriptionRepository;
        this.topicRepository = topicRepository;
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

            // Fetch topic name from database
            const topic = await this.topicRepository.findById(topicId);
            const topicName = topic?.name || 'Невідома тема';
            
            // Format the message
            const messageData = this.messageTemplateService.formatNewsNotification(article, topicName);
            
            // Send to all subscribers
            const userIds = subscriptions.map(sub => sub.userId);
            return await this.sendBulkMessagesWithMedia(userIds, messageData.text, messageData.imageUrl, messageData.url);

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
            console.log(`📤 [NotificationService] Sending podcast file to user ${userId}: ${podcastUrl}`);
            
            // Format the caption message
            const message = this.messageTemplateService.formatPodcastNotification(podcastUrl, topics);
            
            // Send the audio file with caption
            await this.bot.telegram.sendAudio(userId, Input.fromLocalFile(podcastUrl), {
                caption: message,
                parse_mode: 'Markdown'
            });
            
            console.log(`✅ [NotificationService] Podcast sent successfully to user ${userId}`);
            return { success: true };

        } catch (error: any) {
            console.error(`❌ [NotificationService] Error sending podcast to user ${userId}:`, error);
            
            // Handle specific Telegram errors
            if (error.code === 403) {
                return { 
                    success: false, 
                    error: 'User blocked the bot' 
                };
            } else if (error.code === 400) {
                return { 
                    success: false, 
                    error: 'Invalid user ID or file format' 
                };
            } else if (error.code === 429) {
                // Rate limit exceeded, wait and retry once
                await new Promise(resolve => setTimeout(resolve, 1000));
                try {
                    const retryMessage = this.messageTemplateService.formatPodcastNotification(podcastUrl, topics);
                    await this.bot.telegram.sendAudio(userId, Input.fromLocalFile(podcastUrl), {
                        caption: retryMessage,
                        parse_mode: 'Markdown'
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

    async sendBulkMessagesWithMedia(userIds: string[], message: string, imageUrl?: string, articleUrl?: string): Promise<{
        sent: number;
        failed: number;
        errors: string[];
    }> {
        let sent = 0;
        let failed = 0;
        const errors: string[] = [];

        console.log(`Sending bulk message with media to ${userIds.length} users`);

        for (const userId of userIds) {
            try {
                const result = await this.sendMessageWithMedia(userId, message, imageUrl, articleUrl);
                
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
            }
        }

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

    async sendMessageWithMedia(userId: string, message: string, imageUrl?: string, articleUrl?: string, parseMode: 'Markdown' | 'HTML' = 'Markdown'): Promise<{
        success: boolean;
        error?: string;
    }> {
        try {
            const options: any = {
                parse_mode: parseMode,
                link_preview_options: { is_disabled: true }
            };

            // Додаємо кнопку для перегляду статті, якщо є URL
            if (articleUrl) {
                const { Markup } = require('telegraf');
                options.reply_markup = Markup.inlineKeyboard([
                    [Markup.button.url('📖 Читати повністю', articleUrl)]
                ]).reply_markup;
            }

            // Відправляємо повідомлення з зображенням або без нього
            if (imageUrl) {
                await this.bot.telegram.sendPhoto(userId, imageUrl, {
                    caption: message,
                    ...options
                });
            } else {
                await this.bot.telegram.sendMessage(userId, message, options);
            }

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
                    if (imageUrl) {
                        await this.bot.telegram.sendPhoto(userId, imageUrl, {
                            caption: message,
                            parse_mode: 'Markdown'
                        });
                    } else {
                        await this.bot.telegram.sendMessage(userId, message, {
                            parse_mode: 'Markdown',
                            link_preview_options: { is_disabled: true }
                        });
                    }
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
