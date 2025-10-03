import { ITopic } from '@models/Topic';
import { IUser } from '@models/User';
import { ITopicRepository } from '@infrastructure/repositories/ITopicRepository';
import { IUserRepository } from '@infrastructure/repositories/IUserRepository';
import { Types } from 'mongoose';

export class AdminService {
    private topicRepository: ITopicRepository;
    private userRepository: IUserRepository;

    constructor(topicRepository: ITopicRepository, userRepository: IUserRepository) {
        this.topicRepository = topicRepository;
        this.userRepository = userRepository;
    }

    async createTopic(name: string, sourceUrl: string): Promise<ITopic> {
        return await this.topicRepository.create({ name, sourceUrl });
    }

    async updateTopic(id: string, data: Partial<ITopic>): Promise<ITopic | null> {
        return await this.topicRepository.update(id, data);
    }

    async deleteTopic(id: string): Promise<boolean> {
        return await this.topicRepository.delete(id);
    }

    async getAllTopics(): Promise<ITopic[]> {
        return await this.topicRepository.findAll();
    }

    async getUserStatistics(): Promise<any> {
        const totalUsers = await this.userRepository.findAll();
        
        return {
            totalUsers: totalUsers.length,
        };
    }
}
