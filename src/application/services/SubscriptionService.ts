import { ISubscription } from '@models/Subscription';
import { ISubscriptionRepository } from '@infrastructure/repositories/ISubscriptionRepository';
import { ISubscriptionService } from '../interfaces/ISubscriptionService';
import { Types } from 'mongoose';

export class SubscriptionService implements ISubscriptionService {
    private subscriptionRepository: ISubscriptionRepository;

    constructor(subscriptionRepository: ISubscriptionRepository) {
        this.subscriptionRepository = subscriptionRepository;
    }

    async subscribe(userId: Types.ObjectId, topicId: Types.ObjectId): Promise<void> {
        // Check if subscription already exists
        const exists = await this.subscriptionRepository.exists(userId, topicId);
        
        if (!exists) {
            await this.subscriptionRepository.create(userId, topicId);
            console.log(`User ${userId} subscribed to topic ${topicId}`);
        } else {
            console.log(`User ${userId} already subscribed to topic ${topicId}`);
        }
    }

    async unsubscribe(userId: Types.ObjectId, topicId: Types.ObjectId): Promise<void> {
        const deleted = await this.subscriptionRepository.delete(userId, topicId);
        
        if (deleted) {
            console.log(`User ${userId} unsubscribed from topic ${topicId}`);
        } else {
            console.log(`User ${userId} was not subscribed to topic ${topicId}`);
        }
    }

    async getByUserId(userId: Types.ObjectId): Promise<ISubscription[]> {
        return await this.subscriptionRepository.findByUserId(userId);
    }
}