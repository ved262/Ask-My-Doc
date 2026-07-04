import mongoose, { Schema } from 'mongoose'
import { IDocument } from '../types'

const DocumentSchema = new Schema<IDocument>(
    {
        filename: {
            type: String,
            required: true
        },
        originalName: {
            type: String,
            required: true
        },
        extractedText: {
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
        }
    },
    { timestamps: true }
)

export default mongoose.model<IDocument>('Document', DocumentSchema)
