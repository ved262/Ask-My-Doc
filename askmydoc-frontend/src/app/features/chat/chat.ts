import { CommonModule } from '@angular/common';
import { Component, ElementRef, inject, signal, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { DocumentService } from '../../core/services/document.service';
import { IChatMessage, IDocument, MessageRole } from '../../core/models/document.model';

@Component({
  selector: 'app-chat',
  imports: [CommonModule,
    FormsModule,
    RouterModule,
    MatIconModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatSidenavModule,
    MatListModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  templateUrl: './chat.html',
  styleUrl: './chat.scss',
})
export class Chat {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private documentService = inject(DocumentService);
  private snackBar = inject(MatSnackBar);

  documents = signal<IDocument[]>([]);
  activeDocument = signal<IDocument | null>(null);
  messages = signal<IChatMessage[]>([]);
  isTyping = signal(false);
  isSidebarOpen = signal(false);
  question = '';

  @ViewChild('messageContainer') messageContainer!: ElementRef;

  starterPrompts = [
    'What is this document about?',
    'Summarize the key points',
    'What are the main conclusions?',
    'List the most important facts',
  ];

  ngOnInit() {
    this.loadDocuments();
    this.route.params.subscribe(params => {
      if (params['id']) this.loadDocument(params['id']);
    })
  }

  private loadDocuments(): void {
    this.documentService.listDocuments().subscribe({
      next: (response) => this.documents.set(response.documents),
      error: () => this.snackBar.open('Failed to load documents', 'Dismiss', { duration: 3000 })
    })
  }

  private loadDocument(id: string): void {
    this.documentService.getDocument(id).subscribe({
      next: (resposne) => {
        this.activeDocument.set(resposne.document);
        this.messages.set(resposne.document.chatHistory ?? []);
        this.scrollToBottom();
      },
      error: () => this.snackBar.open('Failed to load document', 'Dismiss', { duration: 3000 })
    })
  }

  selectDocument(doc: IDocument): void {
    this.router.navigate(['/chat', doc._id]);
  }

  useStarterPrompt(prompt: string) {
    this.question = prompt;
    this.sendQuestion();
  }

  sendQuestion() {
    const q = this.question.trim();
    const doc = this.activeDocument();
    if (!q || !doc || this.isTyping()) return;
    const userMessage = {
      role: 'user' as MessageRole,
      content: q,
      timestamp: new Date()
    }
    this.messages.update(msgs => [...msgs, userMessage])
    this.question = '';
    this.isTyping.set(true);
    this.scrollToBottom();

    this.documentService.askQuestion(doc._id, q).subscribe({
      next: (response) => {
        const assistantMessage: IChatMessage = {
          role: 'assistant',
          content: response.answer,
          timestamp: new Date(),
          pages: response.pages
        }
        this.messages.update(msgs => [...msgs, assistantMessage]);
        this.isTyping.set(false);
        this.scrollToBottom();
      },
      error: (error) => {
        this.isTyping.set(false);
        const message = error.error?.error || 'Failed to get answer. Please try again.';
        this.snackBar.open(message, "Dismiss", { duration: 3000 });
        this.messages.update(msgs => msgs.slice(0, -1));
      }
    })
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendQuestion();
    }
  }

  navigateToUpload(): void {
    this.router.navigate(['/']);
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      const el = this.messageContainer.nativeElement;
      if (el) el.scrollTop = el.scrollHeight;
    }, 100);
  }

  formatFileSize(bytes: number) {
    return bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / 1024 * 1024).toFixed(1)}`
  }

  toggleSidebar(): void {
    this.isSidebarOpen.set(!this.isSidebarOpen());
  }

}
