import mongoose, { Schema, Document } from 'mongoose';

export enum NewsFrequency {
    HOURLY = 'hourly',
    EVERY_3_HOURS = 'every_3_hours',
    TWICE_DAILY = 'twice_daily',
    DAILY = 'daily',
    DISABLED = 'disabled'
}

export interface IUserSettings extends Document {
    userId: number;
    newsFrequency: NewsFrequency;
    enableAudioPodcasts: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const UserSettingsSchema: Schema = new Schema({
    userId: { type: Number, required: true, unique: true, index: true },
    newsFrequency: { 
        type: String, 
        enum: Object.values(NewsFrequency),
        default: NewsFrequency.DAILY 
    },
    enableAudioPodcasts: { type: Boolean, default: false },
}, {
    timestamps: true
});

export const UserSettings = mongoose.model<IUserSettings>('UserSettings', UserSettingsSchema);

