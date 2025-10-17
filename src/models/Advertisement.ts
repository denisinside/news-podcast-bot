import { Document, Schema, model } from 'mongoose';
import { Types } from 'mongoose';

export enum AdvertisementStatus {
    SCHEDULED = 'SCHEDULED', 
    SENDING = 'SENDING',
    SENT = 'SENT',
    FAILED = 'FAILED',
    CANCELLED = 'CANCELLED'
}

export enum AdvertisementTargetType {
    ALL = 'ALL',
    ACTIVE = 'ACTIVE',
    TOPIC = 'TOPIC',
    ROLE = 'ROLE'
}

export interface IAdvertisement extends Document {
    text: string;
    images?: string[]; // URLs of images
    buttons?: Array<{
        text: string;
        url: string;
    }>;
    targetType: AdvertisementTargetType;
    targetData?: string; // topicId or role name
    scheduledFor?: Date;
    status: AdvertisementStatus;
    createdBy: string; // admin user ID
    createdAt: Date;
    sentAt?: Date;
    stats?: {
        totalRecipients: number;
        sent: number;
        failed: number;
        errors: string[];
    };
}

const AdvertisementSchema = new Schema<IAdvertisement>({
    text: {
        type: String,
        required: true,
        maxlength: 4096 // Telegram message limit
    },
    images: [{
        type: String
    }],
    buttons: [{
        text: {
            type: String,
            required: true,
            maxlength: 64
        },
        url: {
            type: String,
            required: true,
            maxlength: 2048
        }
    }],
    targetType: {
        type: String,
        enum: Object.values(AdvertisementTargetType),
        required: true
    },
    targetData: {
        type: String,
        required: false
    },
    scheduledFor: {
        type: Date,
        required: false,
        index: true
    },
    status: {
        type: String,
        enum: Object.values(AdvertisementStatus),
        default: AdvertisementStatus.SCHEDULED,
        index: true
    },
    createdBy: {
        type: String,
        required: true,
        ref: 'User'
    },
    createdAt: {
        type: Date,
        default: Date.now,
        index: true
    },
    sentAt: {
        type: Date,
        required: false
    },
    stats: {
        totalRecipients: {
            type: Number,
            default: 0
        },
        sent: {
            type: Number,
            default: 0
        },
        failed: {
            type: Number,
            default: 0
        },
        errors: [String]
    }
});

// Index for scheduled advertisements
AdvertisementSchema.index({ scheduledFor: 1, status: 1 });

// Validate images array length
AdvertisementSchema.pre('save', function(next) {
    if (this.images && this.images.length > 10) {
        return next(new Error('Maximum 10 images allowed'));
    }
    next();
});

export const Advertisement = model<IAdvertisement>('Advertisement', AdvertisementSchema);
