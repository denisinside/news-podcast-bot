import { Schema, model, Document, Types } from 'mongoose';

export interface ISubscription extends Document {
    userId: Types.ObjectId;
    topicId: Types.ObjectId;
}

const SubscriptionSchema = new Schema<ISubscription>({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    topicId: {
        type: Schema.Types.ObjectId,
        ref: 'Topic',
        required: true
    }
});

SubscriptionSchema.index({ userId: 1, topicId: 1 }, { unique: true });

export const Subscription = model<ISubscription>('Subscription', SubscriptionSchema);