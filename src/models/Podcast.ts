import { Schema, model, Document, Types } from 'mongoose';

export enum PodcastStatus {
    PENDING = 'PENDING',
    GENERATING = 'GENERATING',
    READY = 'READY',
    FAILED = 'FAILED'
}

export interface IPodcast extends Document {
    userId: Types.ObjectId;
    creationDate: Date;
    fileUrl?: string;
    status: PodcastStatus;
    articles: Types.ObjectId[];
}

const PodcastSchema = new Schema<IPodcast>({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    creationDate: {
        type: Date,
        default: Date.now,
        index: true
    },
    fileUrl: {
        type: String,
        required: false
    },
    status: {
        type: String,
        enum: Object.values(PodcastStatus),
        default: PodcastStatus.PENDING,
        index: true
    },
    articles: [{
        type: Schema.Types.ObjectId,
        ref: 'Article'
    }]
});

export const Podcast = model<IPodcast>('Podcast', PodcastSchema);