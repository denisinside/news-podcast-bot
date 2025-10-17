import { IAdvertisement, AdvertisementStatus, AdvertisementTargetType } from '@models/Advertisement';
import { IAdvertisementRepository } from '@infrastructure/repositories/IAdvertisementRepository';
import { IUserRepository } from '@infrastructure/repositories/IUserRepository';
import { ITopicRepository } from '@infrastructure/repositories/ITopicRepository';
import { ISubscriptionRepository } from '@infrastructure/repositories/ISubscriptionRepository';
import { INotificationService } from '../interfaces/INotificationService';
import { IAdminService } from '../interfaces/IAdminService';

export interface AdvertisementStats {
    total: number;
    scheduled: number;
    sent: number;
    failed: number;
}

export interface AdvertisementPreview {
    text: string;
    images?: string[];
    buttons?: Array<{ text: string; url: string }>;
    targetInfo: string;
    recipientCount: number;
}

export class AdvertisementService {
    constructor(
        private readonly advertisementRepository: IAdvertisementRepository,
        private readonly userRepository: IUserRepository,
        private readonly topicRepository: ITopicRepository,
        private readonly subscriptionRepository: ISubscriptionRepository,
        private readonly notificationService: INotificationService,
        public readonly adminService: IAdminService
    ) {}

    /**
     * Convert Markdown to HTML for Telegram
     */
    private markdownToHtml(text: string): string {
        return text
            // Escape HTML special characters first
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            // Bold: **text** or __text__ -> <b>text</b> (do this before italic)
            .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
            .replace(/__(.*?)__/g, '<b>$1</b>')
            // Italic: *text* or _text_ -> <i>text</i> (but not if already bold)
            .replace(/(?<!\*)\*(?!\*)([^*]+?)\*(?!\*)/g, '<i>$1</i>')
            .replace(/(?<!_)_(?!_)([^_]+?)_(?!_)/g, '<i>$1</i>')
            // Code: `text` -> <code>text</code>
            .replace(/`(.*?)`/g, '<code>$1</code>')
            // Links: [text](url) -> <a href="url">text</a>
            .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
    }

    async createAdvertisement(data: {
        text: string;
        images?: string[];
        buttons?: Array<{ text: string; url: string }>;
        targetType: AdvertisementTargetType;
        targetData?: string;
        scheduledFor?: Date;
        createdBy: string;
    }): Promise<IAdvertisement> {
        // Determine status based on scheduledFor
        const status = data.scheduledFor ? AdvertisementStatus.SCHEDULED : AdvertisementStatus.SENT;
        
        return await this.advertisementRepository.create({
            ...data,
            status
        });
    }

    async getAdvertisementStats(): Promise<AdvertisementStats> {
        const advertisements = await this.advertisementRepository.findAll();
        
        return {
            total: advertisements.length,
            scheduled: advertisements.filter(a => a.status === AdvertisementStatus.SCHEDULED).length,
            sent: advertisements.filter(a => a.status === AdvertisementStatus.SENT).length,
            failed: advertisements.filter(a => a.status === AdvertisementStatus.FAILED).length
        };
    }

    async getScheduledAdvertisements(): Promise<IAdvertisement[]> {
        return await this.advertisementRepository.findScheduled();
    }

    async getAllAdvertisements(): Promise<IAdvertisement[]> {
        return await this.advertisementRepository.findAll();
    }

    async getAdvertisementById(id: string): Promise<IAdvertisement | null> {
        return await this.advertisementRepository.findById(id);
    }

    async updateAdvertisement(id: string, data: Partial<IAdvertisement>): Promise<IAdvertisement | null> {
        return await this.advertisementRepository.update(id, data);
    }

    async deleteAdvertisement(id: string): Promise<boolean> {
        return await this.advertisementRepository.delete(id);
    }

    async getRecipientCount(targetType: AdvertisementTargetType, targetData?: string): Promise<number> {
        try {
            console.log(`getRecipientCount called with targetType: ${targetType}, targetData: ${targetData}`);
            switch (targetType) {
                case AdvertisementTargetType.ALL:
                    const allUsers = await this.userRepository.findAll();
                    console.log(`Found ${allUsers.length} all users`);
                    return allUsers.length;

                case AdvertisementTargetType.ACTIVE:
                    const activeUsers = await this.userRepository.findAll();
                    const activeCount = activeUsers.filter(u => !u.isBlocked).length;
                    console.log(`Found ${activeCount} active users out of ${activeUsers.length} total`);
                    return activeCount;

                case AdvertisementTargetType.TOPIC:
                    if (!targetData) return 0;
                    const topicSubscribers = await this.adminService.getTopicSubscribers(targetData);
                    console.log(`Found ${topicSubscribers.length} topic subscribers for topic ${targetData}`);
                    return topicSubscribers.length;

                case AdvertisementTargetType.ROLE:
                    if (!targetData) return 0;
                    const roleUsers = await this.userRepository.findByRole(targetData);
                    console.log(`Found ${roleUsers.length} users with role ${targetData}`);
                    return roleUsers.length;

                default:
                    console.log(`Unknown targetType: ${targetType}`);
                    return 0;
            }
        } catch (error) {
            console.error('Error getting recipient count:', error);
            return 0;
        }
    }

    async getTargetInfo(targetType: AdvertisementTargetType, targetData?: string): Promise<string> {
        console.log(`getTargetInfo called with targetType: ${targetType}, targetData: ${targetData}`);
        switch (targetType) {
            case AdvertisementTargetType.ALL:
                return 'всім користувачам';

            case AdvertisementTargetType.ACTIVE:
                return 'активним користувачам';

            case AdvertisementTargetType.TOPIC:
                if (!targetData) return 'невідомий топік';
                const topics = await this.adminService.getAllTopics();
                const topic = topics.find(t => String(t._id) === targetData);
                return `підписникам топіку "${topic?.name || 'Невідомий топік'}"`;

            case AdvertisementTargetType.ROLE:
                if (!targetData) return 'невідома роль';
                return `користувачам з роллю "${targetData}"`;

            default:
                console.log(`Unknown targetType: ${targetType}`);
                return 'невідома цільова аудиторія';
        }
    }

    async createPreview(data: {
        text: string;
        images?: string[];
        buttons?: Array<{ text: string; url: string }>;
        targetType: AdvertisementTargetType;
        targetData?: string;
    }): Promise<AdvertisementPreview> {
        try {
            const recipientCount = await this.getRecipientCount(data.targetType, data.targetData);
            const targetInfo = await this.getTargetInfo(data.targetType, data.targetData);

            return {
                text: data.text,
                images: data.images,
                buttons: data.buttons,
                targetInfo,
                recipientCount
            };
        } catch (error) {
            console.error('Error creating preview:', error);
            return {
                text: data.text,
                images: data.images,
                buttons: data.buttons,
                targetInfo: 'невідома аудиторія',
                recipientCount: 0
            };
        }
    }

    async sendAdvertisement(advertisementId: string): Promise<{ success: boolean; message: string }> {
        try {
            const advertisement = await this.advertisementRepository.findById(advertisementId);
            if (!advertisement) {
                return { success: false, message: 'Рекламний пост не знайдено' };
            }

            // Update status to sending
            await this.advertisementRepository.update(advertisementId, {
                status: AdvertisementStatus.SENDING
            });

            // Get recipients
            const recipients = await this.getRecipients(advertisement.targetType, advertisement.targetData);
            
            // Send advertisement
            let sent = 0;
            let failed = 0;
            const errors: string[] = [];

            for (const userId of recipients) {
                try {
                    if (advertisement.images && advertisement.images.length > 0) {
                        // Send with images
                        const result = await this.notificationService.sendMessageWithMedia(
                            userId,
                            this.markdownToHtml(advertisement.text),
                            advertisement.images[0], // Send first image for now
                            undefined, // articleUrl
                            'HTML' // parseMode - використовуємо HTML замість Markdown
                        );
                        
                        if (result.success) {
                            sent++;
                        } else {
                            failed++;
                            errors.push(result.error || 'Unknown error');
                        }
                    } else {
                        // Send text only
                        const result = await this.notificationService.sendMessage(userId, this.markdownToHtml(advertisement.text), 'HTML');
                        
                        if (result.success) {
                            sent++;
                        } else {
                            failed++;
                            errors.push(result.error || 'Unknown error');
                        }
                    }
                } catch (error) {
                    failed++;
                    errors.push(error instanceof Error ? error.message : 'Unknown error');
                }
            }

            // Update advertisement with results
            await this.advertisementRepository.update(advertisementId, {
                status: AdvertisementStatus.SENT,
                sentAt: new Date(),
                stats: {
                    totalRecipients: recipients.length,
                    sent,
                    failed,
                    errors: errors.slice(0, 10) // Keep only first 10 errors
                }
            });

            return {
                success: true,
                message: `Реклама відправлена: ${sent} успішно, ${failed} не вдалося`
            };

        } catch (error) {
            await this.advertisementRepository.update(advertisementId, {
                status: AdvertisementStatus.FAILED
            });

            return {
                success: false,
                message: `Помилка при відправці: ${error}`
            };
        }
    }

    private async getRecipients(targetType: AdvertisementTargetType, targetData?: string): Promise<string[]> {
        switch (targetType) {
            case AdvertisementTargetType.ALL:
                const allUsers = await this.userRepository.findAll();
                return allUsers.map(u => u._id);

            case AdvertisementTargetType.ACTIVE:
                const activeUsers = await this.userRepository.findAll();
                return activeUsers.filter(u => !u.isBlocked).map(u => u._id);

            case AdvertisementTargetType.TOPIC:
                if (!targetData) return [];
                const subscriptions = await this.subscriptionRepository.findByTopicId(targetData);
                return subscriptions.map(s => s.userId);

            case AdvertisementTargetType.ROLE:
                if (!targetData) return [];
                const roleUsers = await this.userRepository.findByRole(targetData);
                return roleUsers.map(u => u._id);

            default:
                return [];
        }
    }
}
