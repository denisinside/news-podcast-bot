import { ISubscription } from '@models/Subscription';
import { Types } from 'mongoose';

export interface ISubscriptionRepository {
    create(userId: string, topicId: Types.ObjectId): Promise<ISubscription>;
    delete(userId: string, topicId: Types.ObjectId): Promise<boolean>;
    exists(userId: string, topicId: Types.ObjectId): Promise<boolean>;
    findByUserId(id: string): Promise<ISubscription[]>;
    findAll(): Promise<ISubscription[]>;
    update(id: string, updateData: Partial<ISubscription>): Promise<ISubscription | null>;
}
