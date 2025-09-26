import { Schema, model, Document, Types } from 'mongoose';

export interface IArticle extends Document {
    title: string;
    url: string;
    content: string;
    publicationDate: Date;
    source: string;
    imageUrl?: string;
    topicId: Types.ObjectId;
}

const ArticleSchema = new Schema<IArticle>({
    title: {
        type: String,
        required: true,
        trim: true
    },
    url: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    content: {
        type: String,
        required: true
    },
    publicationDate: {
        type: Date,
        required: true,
        index: true
    },
    source: {
        type: String,
        required: true
    },
    imageUrl: {
        type: String,
        required: false
    },
    topicId: {
        type: Schema.Types.ObjectId,
        ref: 'Topic',
        required: true,
        index: true
    }
});

export const Article = model<IArticle>('Article', ArticleSchema);