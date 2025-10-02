import { ISubscriptionService } from "../interfaces/ISubscriptionService";

export class SubscriptionService implements ISubscriptionService {
    private subscriptions: { userId: number; topicId: string }[] = [];

    async subscribe(userId: number, topicId: string): Promise<void> {
        this.subscriptions.push({ userId, topicId });
        console.log(`Mock: користувач ${userId} підписався на тему ${topicId}`);
    }
}