import { Topic, ITopic } from '@models/Topic';
import { ITopicRepository } from './ITopicRepository';

export class TopicRepository implements ITopicRepository {
    async findAll(): Promise<ITopic[]> {
        return await Topic.find().sort({ name: 1 });
    }

    async findById(id: string): Promise<ITopic | null> {
        return await Topic.findById(id);
    }

    async create(topic: Partial<ITopic>): Promise<ITopic> {
        const existingTopic = await this.findBySourceUrl(topic.sourceUrl!);
        if (existingTopic) {
            throw new Error(`Topic with sourceUrl '${topic.sourceUrl}' already exists`);
        }
        
        const newTopic = new Topic(topic);
        return await newTopic.save();
    }

    async update(id: string, topic: Partial<ITopic>): Promise<ITopic | null> {
        return await Topic.findByIdAndUpdate(id, topic, { new: true });
    }

    async delete(id: string): Promise<boolean> {
        const result = await Topic.findByIdAndDelete(id);
        return result !== null;
    }

    async findBySourceUrl(sourceUrl: string): Promise<ITopic | null> {
        return await Topic.findOne({ sourceUrl });
    }

    async findByName(name: string): Promise<ITopic | null> {
        return await Topic.findOne({ name });
    }
}
