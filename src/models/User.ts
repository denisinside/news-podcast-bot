import { Schema, model, Document, ObjectId } from 'mongoose';

export interface IUser extends Document {
    telegramId: number;
    username?: string;
    createdAt: Date;
}

const UserSchema = new Schema<IUser>({
    telegramId: {
        type: Number,
        required: true,
        unique: true,
        index: true
    },
    username: {
        type: String,
        required: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

export const User = model<IUser>('User', UserSchema);