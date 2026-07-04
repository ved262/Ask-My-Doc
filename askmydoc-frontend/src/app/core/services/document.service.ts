import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { environment } from "../../../environments/environment";
import { IDocumentUploadResponse, IDocument, IChatResponse } from "../models/document.model";
import { Observable } from "rxjs/internal/Observable";

@Injectable({
    providedIn: 'root'
})
export class DocumentService {
    private http = inject(HttpClient);
    private apiUrl = environment.apiUrl;

    uploadDocument(file: File): Observable<IDocumentUploadResponse>{
        const formData = new FormData();
        formData.append('file', file);
        return this.http.post<IDocumentUploadResponse>(`${this.apiUrl}/documents/upload`, formData);
    }

    listDocuments(): Observable<{message: string, documents: IDocument[]}>{
        return this.http.get<{message: string, documents: IDocument[]}>(`${this.apiUrl}/documents`);
    }

    getDocument(id: string): Observable<{message: string, document: IDocument}>{
        return this.http.get<{message: string, document: IDocument}>(`${this.apiUrl}/documents/${id}`);
    }

    askQuestion(documentId: string, question: string): Observable<IChatResponse>{
        return this.http.post<IChatResponse>(`${this.apiUrl}/chat/${documentId}`, { question });
    }
}