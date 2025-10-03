import { IUser } from '@models/User';
import { IUserRepository } from '@infrastructure/repositories/IUserRepository';
import { Context } from 'telegraf';

export class UserService {
    private userRepository: IUserRepository;

    constructor(userRepository: IUserRepository) {
        this.userRepository = userRepository;
    }

    async findOrCreate(ctx: Context): Promise<IUser> {
        const telegramId = ctx.from?.id;
        const username = ctx.from?.username;

        if (!telegramId) {
            throw new Error('Telegram ID is required');
        }

        // Try to find existing user
        let user = await this.userRepository.findByTelegramId(telegramId);

        // Create new user if not found
        if (!user) {
            user = await this.userRepository.create({
                telegramId,
                username,
                createdAt: new Date()
            });
            console.log(`Created new user: ${telegramId}`);
        }

        return user;
    }

    async findById(id: string): Promise<IUser | null> {
        return await this.userRepository.findById(id);
    }

    async findByTelegramId(telegramId: number): Promise<IUser | null> {
        return await this.userRepository.findByTelegramId(telegramId);
    }

    async createUser(telegramId: number, username?: string): Promise<IUser> {
        return await this.userRepository.create({
            telegramId,
            username,
            createdAt: new Date()
        });
    }
}