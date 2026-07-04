import { Document as MongooseDocument } from 'mongoose';

export interface IDocument extends MongooseDocument {
    filename: string;
    originalName: string;
    extractedText: string;
    fileSize: number;
    pageCount: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface ApiError {
  error: string;
  details?: string;
}
