import { Document as MongooseDocument } from 'mongoose';

export interface IDocument extends MongooseDocument {
    filename: string;
    originalName: string;
    extractedText: string;
    fileSize: number;
    pageCount: number;
    createdAt: Date;
    updatedAt: Date;
    chatHistory: IChatMessage[];
}

export interface ApiError {
  error: string;
  details?: string;
}

export type MessageRole = 'user'|'assistant';

export interface IChatMessage{
  role: MessageRole;
  content: string;
  timestamp: Date;
}

export interface IAskQuestionRequest {
  question: string;
}

export interface IAskQuestionResponse {
  answer: string;
  question: string;
  documentId: string;
}
