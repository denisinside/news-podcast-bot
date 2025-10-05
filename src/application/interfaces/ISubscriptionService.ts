import { Types } from 'mongoose';

export interface ISubscriptionService {
    subscribe(userId: Types.ObjectId, topicId: Types.ObjectId): Promise<void>;
    unsubscribe(userId: Types.ObjectId, topicId: Types.ObjectId): Promise<void>;
    getUserSubscriptions(userId: string): Promise<any[]>;
}