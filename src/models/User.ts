import { Schema, model, Document } from 'mongoose';

export interface IUser extends Document {
    _id: string;
    username?: string;
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
    createdAt: {
        type: Date,
        default: Date.now
    }
});

export const User = model<IUser>('User', UserSchema);