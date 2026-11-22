export type MessageRole = 'assistant' | 'user';

export interface IChatMessage {
    role: MessageRole;
    content: string;
    timestamp: Date;
    pages?: number[]; 
}

export interface IDocument {
    _id: string;
    originalName: string;
    fileSize: number;
    pageCount: number;
    chatHistory: IChatMessage[];
    createdAt: Date;
    updatedAt: Date;
}

export interface IDocumentUploadResponse {
    message: string;
    document: IDocument;
}

export type StreamEvent =
  | { type: 'token'; token: string }
  | { type: 'done'; pages: number[] }
  | { type: 'error'; error: string };