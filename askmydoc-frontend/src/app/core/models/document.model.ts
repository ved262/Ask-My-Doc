export type MessageRole = 'assistant' | 'user';

export interface IChatMessage {
    role: MessageRole;
    content: string;
    timestamp: Date;
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

export interface IDocumentUpload {
    message: string;
    document: IDocument;
}

export interface IChatreposne {
    answer: string;
    question: string;
    documentId: string;
}