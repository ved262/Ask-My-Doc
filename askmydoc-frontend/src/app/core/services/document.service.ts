import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { environment } from "../../../environments/environment";
import { IDocumentUploadResponse, IDocument, IChatResponse, StreamEvent } from "../models/document.model";
import { Observable } from "rxjs/internal/Observable";

@Injectable({
    providedIn: 'root'
})
export class DocumentService {
    private http = inject(HttpClient);
    private apiUrl = environment.apiUrl;

    uploadDocument(file: File): Observable<IDocumentUploadResponse> {
        const formData = new FormData();
        formData.append('file', file);
        return this.http.post<IDocumentUploadResponse>(`${this.apiUrl}/documents/upload`, formData);
    }

    listDocuments(): Observable<{ message: string, documents: IDocument[] }> {
        return this.http.get<{ message: string, documents: IDocument[] }>(`${this.apiUrl}/documents`);
    }

    getDocument(id: string): Observable<{ message: string, document: IDocument }> {
        return this.http.get<{ message: string, document: IDocument }>(`${this.apiUrl}/documents/${id}`);
    }

    askQuestion(documentId: string, question: string): Observable<IChatResponse> {
        return this.http.post<IChatResponse>(`${this.apiUrl}/chat/${documentId}`, { question });
    }

    askQuestionStream(documentId: string, question: string): Observable<StreamEvent> {
        return new Observable<StreamEvent>(subscriber => {
            const controller = new AbortController();

            (async () => {
                try {
                    const response = await fetch(`${this.apiUrl}/chat/${documentId}/stream`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ question }),
                        signal: controller.signal,
                    });

                    // Errors before the stream opens come back as normal JSON
                    if (!response.ok || !response.body) {
                        const body = await response.json().catch(() => null);
                        throw new Error(body?.error ?? 'Request failed');
                    }

                    const reader = response.body.getReader();
                    const decoder = new TextDecoder();
                    let buffer = '';

                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;

                        buffer += decoder.decode(value, { stream: true });

                        // Messages end with a blank line; the last piece may be incomplete
                        const blocks = buffer.split('\n\n');
                        buffer = blocks.pop() ?? '';

                        for (const block of blocks) {
                            const event = this.parseSseBlock(block);
                            if (event) subscriber.next(event);
                        }
                    }

                    subscriber.complete();
                } catch (err) {
                    if (controller.signal.aborted) return;   // we cancelled on purpose
                    subscriber.error(err);
                }
            })();

            // Runs when the component unsubscribes: stops the request
            return () => controller.abort();
        });
    }

    private parseSseBlock(block: string): StreamEvent | null {
        let event = 'message';
        let data = '';

        for (const line of block.split('\n')) {
            if (line.startsWith('event:')) event = line.slice(6).trim();
            else if (line.startsWith('data:')) data += line.slice(5).trim();
        }

        if (!data) return null;
        const payload = JSON.parse(data);

        if (event === 'token') return { type: 'token', token: payload.token };
        if (event === 'done') return { type: 'done', pages: payload.pages };
        if (event === 'error') return { type: 'error', error: payload.error };
        return null;
    }
}