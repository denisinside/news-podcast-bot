import { IUser } from '../../models'

export interface IUserService {
    findById(id: string): Promise<IUser | null>;
    createUser(telegramId: string, username?: string): Promise<IUser | null>;
    findOrCreateUser(telegramId: string, username: string): Promise<IUser>;
}
