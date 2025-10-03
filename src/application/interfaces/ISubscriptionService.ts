import { ISubscription } from "../../models";

export interface ISubscriptionService {
    subscribe(userId: number, topicId: string): Promise<void>;
    unsubscribe(userId: number, topicId: string): Promise<void>;
    getUserSubscriptions(userId: number): Promise<ISubscription[]>;
}