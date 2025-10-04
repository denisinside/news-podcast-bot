import { IUser } from '@models/User';
import { IUserRepository } from '@infrastructure/repositories/IUserRepository';
import { Context } from 'telegraf';
import {IUserService} from "@application/interfaces";

export class UserService implements IUserService {
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
        const telegramIdStr = String(telegramId);
        // Try to find existing user
        let user = await this.userRepository.findById(telegramIdStr);

        // Create new user if not found
        if (!user) {
            user = await this.userRepository.create({
                _id:telegramIdStr,
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

    async createUser(telegramId: string, username?: string): Promise<IUser> {
        return await this.userRepository.create({
            _id: telegramId,
            username,
            createdAt: new Date()
        });
    }
}