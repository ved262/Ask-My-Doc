import { ChangeDetectorRef, Component, inject, signal } from '@angular/core';
import { DocumentService } from '../../core/services/document.service';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { IDocument } from '../../core/models/document.model';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-upload',
  imports: [CommonModule, MatSnackBarModule, MatButtonModule, MatIconModule, MatProgressBarModule],
  templateUrl: './upload.html',
  styleUrl: './upload.scss',
})
export class Upload {
  private documentService = inject(DocumentService);
  private auth = inject(AuthService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private cdr = inject(ChangeDetectorRef);

  isDragging = false;
  isUploading = false;
  recentDocuments = signal<IDocument[]>([]);

  ngOnInit(){
    this.documentService.listDocuments().subscribe({
      next: (response) => this.recentDocuments.set(response.documents),
      error: () => {}
    })
  }

  onDragOver(event: DragEvent):void {
    event.preventDefault();
    this.isDragging = true;
  }

  onDragLeave(): void {
    this.isDragging = false;
  }

  onDrop(event: DragEvent):void {
     event.preventDefault();
     this.isDragging = false;
     const file = event.dataTransfer?.files[0];
     if(file) this.upload(file);   
  }

  onFileSelected(event: Event):void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if(file) this.upload(file);
  }

  goToDocument(id: string){
    this.router.navigate(['/chat',id]);
  }

  private upload(file:File): void {
    if(file.type !== 'application/pdf'){
      this.snackBar.open('Only PDF files are allowed!', 'Dismiss', { duration: 3000 });
      return;
    }
    if(file.size > 10*1024*1024){
      this.snackBar.open('File size exceeds 10MB limit!', 'Dismiss', { duration: 3000 });
      return;
    }

    this.isUploading = true;
    this.documentService.uploadDocument(file).subscribe({
      next: (response) => {
        this.isUploading = false;
        this.cdr.detectChanges();
        this.router.navigate(['/chat', response.document._id]);
        this.snackBar.open('File uploaded successfully!', 'Dismiss', { duration: 3000 });
      },
      error: (error) => {
        this.isUploading = false;
        this.cdr.detectChanges();
        const message = error?.error?.message || 'An error occurred during upload.';
        this.snackBar.open(message, 'Dismiss', { duration: 3000 });
      }
    })
  }
}
