import { Types } from 'mongoose';
import { ISubscription } from "@/models";

export interface ISubscriptionService {
    subscribe(userId: string, topicId: Types.ObjectId): Promise<void>;
    unsubscribe(userId: string, topicId: Types.ObjectId): Promise<void>;
    getUserSubscriptions(userId: string): Promise<ISubscription[]>;
}