import { Document as MongooseDocument } from 'mongoose';

export interface IDocument extends MongooseDocument {
    originalName: string;
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
  pages?: number[];
}

export interface IAskQuestionRequest {
  question: string;
}

// ─── RAG ──────────────────────────────────────────────────────────────────────

export interface IPageText {
  pageNumber: number;
  text: string;
}

export interface IChunk {
  text: string;
  pageNumber: number;   // which PDF page this chunk came from
  chunkIndex: number;   // position within the whole document
}

export interface ISearchResult {
  text: string;
  pageNumber: number;
  score: number;   // similarity: closer to 1 = closer in meaning
}

export interface IExtractedPdf {
  pages: IPageText[];
  totalPages: number;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface IUser extends MongooseDocument {
  email: string;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthRequestBody {
  email: string;
  password: string;
}