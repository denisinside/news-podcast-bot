import { Schema, model, Document } from 'mongoose';

export enum UserRole {
    USER = 'USER',
    ADMIN = 'ADMIN'
}

export interface IUser extends Document {
    _id: string;
    username?: string;
    role: UserRole;
    isBlocked: boolean;
    createdAt: Date;
}

const UserSchema = new Schema<IUser>({
    _id: {
        type: String,
        required: true,
    },
    username: {
        type: String,
        required: false
    },
    role: {
        type: String,
        enum: Object.values(UserRole),
        default: UserRole.USER
    },
    isBlocked: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

export const User = model<IUser>('User', UserSchema);