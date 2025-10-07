import { IUser } from '@models/User';
import { IUserRepository } from '@infrastructure/repositories/IUserRepository';
import { IUserService } from "@application/interfaces";

export class UserService implements IUserService {
    private userRepository: IUserRepository;

    constructor(userRepository: IUserRepository) {
        this.userRepository = userRepository;
    }

    async findOrCreateUser(telegramId: string, username: string): Promise<IUser>{
        if (!telegramId) {
            throw new Error('Telegram ID is required');
        }
        let user = await this.userRepository.findById(telegramId);

        if (!user) {
            user = await this.userRepository.create({
                _id:telegramId,
                username,
            });
            console.log(`Created new user: ${telegramId}`);
        }

        return user;
    }

    async findById(id: string): Promise<IUser | null> {
        return await this.userRepository.findById(id);
    }

    async createUser(telegramId: string, username?: string): Promise<IUser> {
        return await this.userRepository.create({
            _id: telegramId,
            username,
            createdAt: new Date()
        });
    }
}