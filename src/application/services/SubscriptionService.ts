import { ISubscriptionService } from "../interfaces/ISubscriptionService";
import { ISubscription } from "../../models";

export class SubscriptionService implements ISubscriptionService {
    private subscriptions: { userId: number; topicId: string }[] = [];

    async subscribe(userId: number, topicId: string): Promise<void> {
        // Check if already subscribed
        const existingSubscription = this.subscriptions.find(
            sub => sub.userId === userId && sub.topicId === topicId
        );
        
        if (!existingSubscription) {
            this.subscriptions.push({ userId, topicId });
            console.log(`Mock: користувач ${userId} підписався на тему ${topicId}`);
        }
    }

    async unsubscribe(userId: number, topicId: string): Promise<void> {
        const index = this.subscriptions.findIndex(
            sub => sub.userId === userId && sub.topicId === topicId
        );
        
        if (index !== -1) {
            this.subscriptions.splice(index, 1);
            console.log(`Mock: користувач ${userId} відписався від теми ${topicId}`);
        }
    }

    async getUserSubscriptions(userId: number): Promise<ISubscription[]> {
        const userSubs = this.subscriptions.filter(sub => sub.userId === userId);
        console.log(`Mock: користувач ${userId} має ${userSubs.length} підписок`);
        
        // Return mock subscriptions with topic info
        return userSubs.map(sub => ({
            userId: sub.userId,
            topicId: sub.topicId,
            _id: sub.topicId, // Mock ID
            __v: 0
        } as any));
    }
}