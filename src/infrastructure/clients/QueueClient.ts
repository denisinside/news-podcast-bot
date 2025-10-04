import { IQueueClient } from "./IQueueClient";
import { Types } from "mongoose";

export class QueueClient implements IQueueClient {
    constructor() {}
    addNewsFetchJob(): Promise<void> {
        throw new Error("Method not implemented.");
    }
    addPodcastJob(data: { userId: Types.ObjectId }): Promise<void> {
        throw new Error("Method not implemented.");
    }
}