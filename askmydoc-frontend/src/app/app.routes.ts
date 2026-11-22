import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/guards/auth.guard';

export const routes: Routes = [
    {
        path: 'login',
        canActivate: [guestGuard],
        loadComponent: () => 
            import('./features/auth/auth').then(m => m.Auth)
    },
    {
        path: '',
        canActivate: [authGuard],
        loadComponent: () => import('./features/upload/upload').then(m => m.Upload)
    },
    {
        path: 'chat/:id',
        canActivate: [authGuard],
        loadComponent: () => import('./features/chat/chat').then(m => m.Chat)
    },
    {
        path: '**',
        redirectTo: ''
    }
];
