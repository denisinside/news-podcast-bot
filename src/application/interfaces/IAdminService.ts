import { ITopic } from "../../models";
export interface IAdminService {
    getAllTopics(): Promise<ITopic[]>;
    // createTopic(topic: ITopic): Promise<ITopic>;
    // findTopicByName(name: string): Promise<ITopic | null>;

}