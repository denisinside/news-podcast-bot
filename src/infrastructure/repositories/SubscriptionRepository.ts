import { Subscription, ISubscription } from '@models/Subscription';
import { ISubscriptionRepository } from './ISubscriptionRepository';
import { Types } from 'mongoose';

export class SubscriptionRepository implements ISubscriptionRepository {
    async findByUserId(userId: string): Promise<ISubscription[]> {
        return await Subscription.find({ userId }).populate('topicId');
    }

    async create(userId: Types.ObjectId, topicId: Types.ObjectId): Promise<ISubscription> {
        const subscription = new Subscription({ userId, topicId });
        return await subscription.save();
    }

    async delete(userId: Types.ObjectId, topicId: Types.ObjectId): Promise<boolean> {
        const result = await Subscription.findOneAndDelete({ userId, topicId });
        return result !== null;
    }

    async exists(userId: Types.ObjectId, topicId: Types.ObjectId): Promise<boolean> {
        const subscription = await Subscription.findOne({ userId, topicId });
        return subscription !== null;
    }

    async findById(id: string): Promise<ISubscription | null> {
        return await Subscription.findById(id).populate('topicId');
    }

    async findAll(): Promise<ISubscription[]> {
        return await Subscription.find().populate('topicId');
    }

    async update(id: string, updateData: Partial<ISubscription>): Promise<ISubscription | null> {
        return await Subscription.findByIdAndUpdate(id, updateData, { new: true });
    }
}
