import { ITopic } from '@models/Topic';
import { IUser, UserRole } from '@models/User';
import { IArticle } from '@models/Article';
import { ISubscription } from '@models/Subscription';
import { ITopicRepository } from '@infrastructure/repositories/ITopicRepository';
import { IUserRepository } from '@infrastructure/repositories/IUserRepository';
import { ISubscriptionRepository } from '@infrastructure/repositories/ISubscriptionRepository';
import { IPodcastRepository } from '@infrastructure/repositories/IPodcastRepository';
import { IArticleRepository } from '@infrastructure/repositories/IArticleRepository';
import { PodcastStatus } from '@models/Podcast';
import { INewsFinderService } from '../interfaces/INewsFinderService';
import {
    IAdminService,
    TopicWithSubscribers,
    UserStatistics,
    SubscriptionStatistics,
    PodcastStatistics
} from '@application/interfaces/IAdminService';

export class AdminService implements IAdminService {
    constructor(
        private readonly topicRepository: ITopicRepository,
        private readonly userRepository: IUserRepository,
        private readonly subscriptionRepository: ISubscriptionRepository,
        private readonly podcastRepository: IPodcastRepository,
        private readonly articleRepository: IArticleRepository,
        private readonly newsFinderService?: INewsFinderService
    ) {}

    // ==================== TOPIC MANAGEMENT ====================
    
    async getAllTopics(): Promise<ITopic[]> {
        return await this.topicRepository.findAll();
    }

    async getTopicsWithSubscribers(): Promise<TopicWithSubscribers[]> {
        const topics = await this.topicRepository.findAll();
        const topicsWithSubs: TopicWithSubscribers[] = [];

        for (const topic of topics) {
            const subscriptions = await this.subscriptionRepository.findByTopicId(String(topic._id));
            topicsWithSubs.push({
                ...topic.toObject(),
                subscribersCount: subscriptions.length
            });
        }

        return topicsWithSubs;
    }

    async createTopic(name: string, sourceUrl: string): Promise<ITopic> {
        return await this.topicRepository.create({ name, sourceUrl });
    }

    async updateTopic(id: string, data: Partial<ITopic>): Promise<ITopic | null> {
        return await this.topicRepository.update(id, data);
    }

    async deleteTopic(id: string): Promise<boolean> {
        return await this.topicRepository.delete(id);
    }

    async deleteTopicWithSubscriptions(id: string): Promise<{ success: boolean; subscribersCount: number; subscriberIds: string[] }> {
        // Get all subscriptions for this topic before deleting
        const subscriptions = await this.subscriptionRepository.findByTopicId(id);
        const subscriberIds = [...new Set(subscriptions.map(sub => sub.userId))]; // unique user IDs
        
        // Delete the topic
        const topicDeleted = await this.topicRepository.delete(id);
        
        if (!topicDeleted) {
            return { success: false, subscribersCount: 0, subscriberIds: [] };
        }
        
        // Note: Subscriptions with deleted topicId will remain in DB but filtered out in queries
        // This is intentional - we keep subscription history
        
        return {
            success: true,
            subscribersCount: subscriberIds.length,
            subscriberIds
        };
    }

    // ==================== USER MANAGEMENT ====================
    
    async getAllUsers(): Promise<IUser[]> {
        return await this.userRepository.findAll();
    }

    async getUserById(id: string): Promise<IUser | null> {
        return await this.userRepository.findById(id);
    }

    async blockUser(id: string): Promise<IUser | null> {
        return await this.userRepository.blockUser(id);
    }

    async unblockUser(id: string): Promise<IUser | null> {
        return await this.userRepository.unblockUser(id);
    }

    async setUserRole(id: string, role: string): Promise<IUser | null> {
        return await this.userRepository.update(id, { role: role as UserRole });
    }

    // ==================== STATISTICS ====================
    
    async getUserStatistics(): Promise<UserStatistics> {
        const allUsers = await this.userRepository.findAll();
        const activeUsers = await this.userRepository.countActiveUsers();
        
        const now = new Date();
        const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        const newUsersToday = await this.userRepository.countNewUsers(oneDayAgo);
        const newUsersWeek = await this.userRepository.countNewUsers(oneWeekAgo);
        const newUsersMonth = await this.userRepository.countNewUsers(oneMonthAgo);

        const blockedUsers = allUsers.filter(u => u.isBlocked).length;
        const adminUsers = allUsers.filter(u => u.role === UserRole.ADMIN).length;
        const ownerUsers = allUsers.filter(u => u.role === UserRole.OWNER).length;

        return {
            totalUsers: allUsers.length,
            activeUsers,
            blockedUsers,
            adminUsers,
            ownerUsers,
            newUsersToday,
            newUsersWeek,
            newUsersMonth
        };
    }

    async getSubscriptionStatistics(): Promise<SubscriptionStatistics> {
        const allSubscriptions = await this.subscriptionRepository.findAll();
        const activeSubscriptions = allSubscriptions.filter(s => s.isActive);
        const allUsers = await this.userRepository.findAll();

        console.log('Subscription statistics debug:', {
            totalSubscriptions: allSubscriptions.length,
            activeSubscriptions: activeSubscriptions.length,
            allUsers: allUsers.length
        });

        const averageSubscriptionsPerUser = allUsers.length > 0 
            ? activeSubscriptions.length / allUsers.length 
            : 0;

        // Count subscriptions per topic
        const topicCounts = new Map<string, { name: string; count: number }>();
        const topics = await this.topicRepository.findAll();

        console.log('Topics found:', topics.map(t => ({ id: t._id, name: t.name })));

        for (const subscription of activeSubscriptions) {
            // Handle both ObjectId and populated topicId
            let topicId: string;
            let topicName: string | undefined;
            
            if (typeof subscription.topicId === 'object' && subscription.topicId !== null) {
                // If topicId is populated (contains the full topic object)
                topicId = String((subscription.topicId as any)._id);
                topicName = (subscription.topicId as any).name;
            } else {
                // If topicId is just an ObjectId
                topicId = String(subscription.topicId);
                const topic = topics.find(t => String(t._id) === topicId);
                topicName = topic?.name;
            }
            
            console.log('Processing subscription:', {
                subscriptionId: subscription._id,
                topicId: topicId,
                topicName: topicName,
                isActive: subscription.isActive
            });
            
            if (topicName) {
                if (topicCounts.has(topicId)) {
                    topicCounts.get(topicId)!.count++;
                } else {
                    topicCounts.set(topicId, { name: topicName, count: 1 });
                }
            }
        }

        console.log('Topic counts:', Array.from(topicCounts.entries()));

        const topicDistribution = Array.from(topicCounts.entries()).map(([topicId, data]) => ({
            topicId,
            topicName: data.name,
            count: data.count
        }));

        return {
            totalSubscriptions: activeSubscriptions.length,
            averageSubscriptionsPerUser,
            topicDistribution
        };
    }

    async getPodcastStatistics(): Promise<PodcastStatistics> {
        const allPodcasts = await this.podcastRepository.findAll();

        const pendingPodcasts = allPodcasts.filter(p => p.status === PodcastStatus.PENDING).length;
        const generatingPodcasts = allPodcasts.filter(p => p.status === PodcastStatus.GENERATING).length;
        const readyPodcasts = allPodcasts.filter(p => p.status === PodcastStatus.READY).length;
        const failedPodcasts = allPodcasts.filter(p => p.status === PodcastStatus.FAILED).length;

        return {
            totalPodcasts: allPodcasts.length,
            pendingPodcasts,
            generatingPodcasts,
            readyPodcasts,
            failedPodcasts
        };
    }

    async getUserSubscriptions(userId: string): Promise<ISubscription[]> {
        return await this.subscriptionRepository.findByUserId(userId);
    }

    async getRecentArticlesByTopics(topicIds: string[], limit: number): Promise<IArticle[]> {
        // This is a simplified implementation - in real scenario you'd want to query articles by topic
        const allArticles = await this.articleRepository.findAll();
        
        // Filter articles by topic IDs and sort by publication date
        const filteredArticles = allArticles
            .filter(article => {
                const articleTopicId = (article as any).topicId?._id || (article as any).topicId;
                return topicIds.includes(String(articleTopicId));
            })
            .sort((a, b) => new Date(b.publicationDate).getTime() - new Date(a.publicationDate).getTime())
            .slice(0, limit);

        return filteredArticles;
    }

    async getTopicSubscribers(topicId: string): Promise<string[]> {
        // Get all subscriptions and filter by topicId
        const allSubscriptions = await this.subscriptionRepository.findAll();
        const topicSubscriptions = allSubscriptions.filter(sub => {
            if (typeof sub.topicId === 'object' && sub.topicId !== null) {
                // If topicId is populated (contains the full topic object)
                return String((sub.topicId as any)._id) === topicId && sub.isActive;
            } else {
                // If topicId is just an ObjectId
                return String(sub.topicId) === topicId && sub.isActive;
            }
        });
        
        console.log('Topic subscribers debug:', {
            topicId,
            subscriptionsFound: topicSubscriptions.length,
            subscriptions: topicSubscriptions.map(s => ({
                id: s._id,
                userId: s.userId,
                topicId: typeof s.topicId === 'object' ? String((s.topicId as any)._id) : String(s.topicId),
                isActive: s.isActive
            }))
        });
        
        return topicSubscriptions.map(sub => sub.userId);
    }

    async triggerNewsParsing(): Promise<{ success: boolean; message: string }> {
        try {
            if (!this.newsFinderService) {
                return {
                    success: false,
                    message: "Сервіс парсингу новин недоступний"
                };
            }

            await this.newsFinderService.fetchAndSaveAllTopics();
        
        return {
                success: true,
                message: "Парсинг новин запущено успішно"
            };
        } catch (error) {
            console.error("Error triggering news parsing:", error);
            return {
                success: false,
                message: `Помилка при запуску парсингу: ${error}`
            };
        }
    }
}
