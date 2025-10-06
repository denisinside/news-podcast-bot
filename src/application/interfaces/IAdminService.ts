import { ITopic, IUser } from "../../models";

export interface TopicWithSubscribers extends ITopic {
    subscribersCount?: number;
}

export interface UserStatistics {
    totalUsers: number;
    activeUsers: number;
    blockedUsers: number;
    adminUsers: number;
    newUsersToday: number;
    newUsersWeek: number;
    newUsersMonth: number;
}

export interface SubscriptionStatistics {
    totalSubscriptions: number;
    averageSubscriptionsPerUser: number;
    topicDistribution: Array<{ topicId: string; topicName: string; count: number }>;
}

export interface PodcastStatistics {
    totalPodcasts: number;
    pendingPodcasts: number;
    generatingPodcasts: number;
    readyPodcasts: number;
    failedPodcasts: number;
}

export interface IAdminService {
    // Topic management
    getAllTopics(): Promise<ITopic[]>;
    getTopicsWithSubscribers(): Promise<TopicWithSubscribers[]>;
    createTopic(name: string, sourceUrl: string): Promise<ITopic>;
    updateTopic(id: string, data: Partial<ITopic>): Promise<ITopic | null>;
    deleteTopic(id: string): Promise<boolean>;
    
    // User management
    getAllUsers(): Promise<IUser[]>;
    getUserById(id: string): Promise<IUser | null>;
    blockUser(id: string): Promise<IUser | null>;
    unblockUser(id: string): Promise<IUser | null>;
    setUserRole(id: string, role: string): Promise<IUser | null>;
    
    // Statistics
    getUserStatistics(): Promise<UserStatistics>;
    getSubscriptionStatistics(): Promise<SubscriptionStatistics>;
    getPodcastStatistics(): Promise<PodcastStatistics>;
}