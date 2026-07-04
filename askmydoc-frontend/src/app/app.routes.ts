import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path: '',
        loadComponent: () => import('./features/upload/upload').then(m => m.Upload)
    },
    {
        path: '**',
        redirectTo: ''
    }
];
