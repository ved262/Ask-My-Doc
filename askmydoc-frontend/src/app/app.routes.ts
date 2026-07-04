import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path: '',
        loadComponent: () => import('./features/upload/upload').then(m => m.Upload)
    },
    {
        path: 'chat/:id',
        loadComponent: () => import('./features/chat/chat').then(m => m.Chat)
    },
    {
        path: '**',
        redirectTo: ''
    }
];
