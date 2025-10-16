import { IUser } from '@models/User';

export interface IUserRepository {
    findById(id: string): Promise<IUser | null>;
    findByTelegramId(telegramId: number): Promise<IUser | null>;
    create(userData: Partial<IUser>): Promise<IUser>;
    update(id: string, updateData: Partial<IUser>): Promise<IUser | null>;
    delete(id: string): Promise<boolean>;
    findAll(): Promise<IUser[]>;
    findByRole(role: string): Promise<IUser[]>;
    blockUser(id: string): Promise<IUser | null>;
    unblockUser(id: string): Promise<IUser | null>;
    countActiveUsers(): Promise<number>;
    countNewUsers(since: Date): Promise<number>;
}
