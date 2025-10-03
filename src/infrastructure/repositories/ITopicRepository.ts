import { ITopic } from '@models/Topic';
import { Types } from 'mongoose';

export interface ITopicRepository {
    findAll(): Promise<ITopic[]>;
    findById(id: string): Promise<ITopic | null>;
    create(topic: Partial<ITopic>): Promise<ITopic>;
    update(id: string, topic: Partial<ITopic>): Promise<ITopic | null>;
    delete(id: string): Promise<boolean>;
    findBySourceUrl(sourceUrl: string): Promise<ITopic | null>;
    findByName(name: string): Promise<ITopic | null>;
}
