import { Types } from 'mongoose';

export interface IQueueClient {
    addNewsFetchJob(): Promise<void>;
    addPodcastJob(data: { userId: Types.ObjectId }): Promise<void>;
}
