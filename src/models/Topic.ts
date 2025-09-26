import { Schema, model, Document } from 'mongoose';

export interface ITopic extends Document {
    name: string;
    sourceUrl: string;
}

const TopicSchema = new Schema<ITopic>({
    name: {
        type: String,
        required: true,
        trim: true
    },
    sourceUrl: {
        type: String,
        required: true,
        unique: true
    }
});

export const Topic = model<ITopic>('Topic', TopicSchema);