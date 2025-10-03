import { User, IUser } from '@models/User';
import { IUserRepository } from './IUserRepository';

export class UserRepository implements IUserRepository {
    async findByTelegramId(telegramId: number): Promise<IUser | null> {
        return await User.findOne({ telegramId });
    }

    async create(userData: Partial<IUser>): Promise<IUser> {
        const user = new User(userData);
        return await user.save();
    }

    async findById(id: string): Promise<IUser | null> {
        return await User.findById(id);
    }

    async update(id: string, updateData: Partial<IUser>): Promise<IUser | null> {
        return await User.findByIdAndUpdate(id, updateData, { new: true });
    }

    async delete(id: string): Promise<boolean> {
        const result = await User.findByIdAndDelete(id);
        return result !== null;
    }

    async findAll(): Promise<IUser[]> {
        return await User.find();
    }
}
