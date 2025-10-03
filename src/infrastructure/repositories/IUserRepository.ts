import { IUser } from '@models/User';

export interface IUserRepository {
    findByTelegramId(telegramId: number): Promise<IUser | null>;
    findById(id: string): Promise<IUser | null>;
    create(userData: Partial<IUser>): Promise<IUser>;
    update(id: string, updateData: Partial<IUser>): Promise<IUser | null>;
    delete(id: string): Promise<boolean>;
    findAll(): Promise<IUser[]>;
    findActiveUsers(): Promise<IUser[]>;
}
