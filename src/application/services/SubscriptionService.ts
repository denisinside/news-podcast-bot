import { ISubscriptionService } from "../interfaces/ISubscriptionService";
import { ISubscription } from "@/models";
import { ISubscriptionRepository } from "@infrastructure/repositories";
import { Types } from "mongoose";

export class SubscriptionService implements ISubscriptionService {
    private subscriptionRepository: ISubscriptionRepository;

    constructor(subscriptionRepository: ISubscriptionRepository) {
        this.subscriptionRepository = subscriptionRepository;
    }

    async subscribe(userId: string, topicId: Types.ObjectId): Promise<void> {
        const exists = await this.subscriptionRepository.exists(userId, topicId);

        if (!exists) {
            await this.subscriptionRepository.create(userId, topicId);
            console.log(`User ${userId} subscribed to topic ${topicId}`);
        } else {
            console.log(`User ${userId} already subscribed to topic ${topicId}`);
        }
    }

    async unsubscribe(userId: string, topicId: Types.ObjectId): Promise<void> {
        const deleted = await this.subscriptionRepository.delete(userId, topicId);

        if (deleted) {
            console.log(`User ${userId} unsubscribed from topic ${topicId}`);
        } else {
            console.log(`User ${userId} was not subscribed to topic ${topicId}`);
        }
    }

    async getUserSubscriptions(userId: string): Promise<ISubscription[]> {
        return await this.subscriptionRepository.findByUserId(userId);
    }
}