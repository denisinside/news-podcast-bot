import { ISubscription } from '@models/Subscription';
import { Types } from 'mongoose';

export interface ISubscriptionRepository {
    findByUserId(userId: string): Promise<ISubscription[]>;
    create(userId: string, topicId: Types.ObjectId): Promise<ISubscription>;
    delete(userId: string, topicId: Types.ObjectId): Promise<boolean>;
    exists(userId: string, topicId: Types.ObjectId): Promise<boolean>;
    findById(id: string): Promise<ISubscription | null>;
    findAll(): Promise<ISubscription[]>;
    update(id: string, updateData: Partial<ISubscription>): Promise<ISubscription | null>;
}
