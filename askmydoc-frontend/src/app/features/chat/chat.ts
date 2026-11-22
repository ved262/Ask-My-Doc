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
import { Subscription } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';

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
  private auth = inject(AuthService);
  private snackBar = inject(MatSnackBar);
  isStreaming = signal(false);
  private streamSub?: Subscription;

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
      if (params['id']) {
        this.cancelStream();
        this.loadDocument(params['id']);
      }
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

    const startLength = this.messages().length;
    this.messages.update(msgs => [
      ...msgs,
      { role: 'user', content: q, timestamp: new Date() },
    ]);
    this.question = '';
    this.isTyping.set(true);
    this.scrollToBottom();

    this.streamSub = this.documentService.askQuestionStream(doc._id, q).subscribe({
      next: (event) => {
        if (event.type === 'token') this.appendToken(event.token);
        else if (event.type === 'done') this.finishStream(event.pages);
        else this.failStream(event.error, startLength, q);
      },
      error: (err) => this.failStream(err.message, startLength, q),
    })
  }

  private appendToken(token: string): void {
    if (!this.isStreaming()) {
      // First token: dots disappear, the assistant bubble appears
      this.isStreaming.set(true);
      this.messages.update(msgs => [
        ...msgs,
        { role: 'assistant', content: token, timestamp: new Date() },
      ]);
    } else {
      this.messages.update(msgs => {
        const last = msgs[msgs.length - 1];
        return [...msgs.slice(0, -1), { ...last, content: last.content + token }];
      });
    }
    this.scrollToBottomNow();
  }

  private finishStream(pages: number[]): void {
    if (this.isStreaming()) {
      this.messages.update(msgs => {
        const last = msgs[msgs.length - 1];
        return [...msgs.slice(0, -1), { ...last, pages }];   // page chips appear
      });
    }
    this.resetStreamState();
  }

  private failStream(message: string, startLength: number, question: string): void {
    // Remove the question and any half-written answer, and give the text back
    this.messages.update(msgs => msgs.slice(0, startLength));
    this.question = question;
    this.resetStreamState();
    this.snackBar.open(message || 'Failed to get answer. Please try again.', 'Dismiss', { duration: 4000 });
  }

  private cancelStream(): void {
    this.streamSub?.unsubscribe();
    this.resetStreamState();
  }

  private resetStreamState(): void {
    this.isTyping.set(false);
    this.isStreaming.set(false);
    this.streamSub = undefined;
  }

  private scrollToBottomNow(): void {
    requestAnimationFrame(() => {
      const el = this.messageContainer?.nativeElement;
      if (el) el.scrollTop = el.scrollHeight;
    });
  }

  ngOnDestroy(): void {
    this.cancelStream();
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
