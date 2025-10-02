import { IUser } from '../../models'

export interface IUserService {
    findByTelegramId(telegramId: number): Promise<IUser | null>;
    findById(id: string): Promise<IUser | null>;
    createUser(telegramId: number, username: string): Promise<IUser | null>;
}
