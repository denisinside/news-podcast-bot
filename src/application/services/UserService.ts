import { IUser, User } from "../../models";
import { IUserService } from "../interfaces";

export class UserService implements IUserService {
    async createUser(telegramId: number, username: string): Promise<IUser | null> {

        const newUser = new User({
            telegramId,
            username,
            createdAt: new Date(),
        });

        return await newUser.save();
    }

    async findById(id: string): Promise<IUser | null> {
        return User.findById(id);
    }

    async findByTelegramId(telegramId: number): Promise<IUser | null> {
        return User.findOne({ telegramId });
    }

}