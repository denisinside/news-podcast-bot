export interface ISubscriptionService {
    subscribe(userId: number, topicId: string): Promise<void>;
}