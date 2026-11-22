import mongoose, { Schema } from 'mongoose'
import { IDocument, IChatMessage } from '../types'

const ChatMessageSchema = new Schema<IChatMessage>({
    role: {
        type: String,
        enum: ['user', 'assistant'],
        required: true
    },
    content: {
        type: String,
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    pages: {
        type: [Number],
        default: undefined
    }
}, { _id: false })

const DocumentSchema = new Schema<IDocument>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true
        },
        originalName: {
            type: String,
            required: true
        },
        fileSize: {
            type: Number,
            required: true
        },
        pageCount: {
            type: Number,
            default: 0
        },
        chatHistory: {
            type: [ChatMessageSchema],
            default: []
        }
    },
    { timestamps: true }
)

export default mongoose.model<IDocument>('Document', DocumentSchema)
