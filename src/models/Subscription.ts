import { Schema, model, Document, Types } from 'mongoose';

export interface ISubscription extends Document {
    userId: string;
    topicId: Types.ObjectId;
    subscribedAt: Date;
    isActive: boolean;
}

const SubscriptionSchema = new Schema<ISubscription>({
    userId: {
        type: String,
        required: true,
        ref: 'User'
    },
    topicId: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'Topic'
    },
    subscribedAt: {
        type: Date,
        default: Date.now
    },
    isActive: {
        type: Boolean,
        default: true
    }
});

SubscriptionSchema.index({ userId: 1, topicId: 1 }, { unique: true });
SubscriptionSchema.index({ userId: 1, isActive: 1 });

export const Subscription = model<ISubscription>('Subscription', SubscriptionSchema);