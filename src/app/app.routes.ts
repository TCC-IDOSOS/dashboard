import { Routes } from '@angular/router';
import { authGuard } from './guards/login.guard';

export const routes: Routes = [
  { path: "login", loadComponent: () => import("./pages/login/login")},
    {
      path: '',
        canActivate: [authGuard], 
        children: [
          { path: "usuarios", loadComponent: () => import("./pages/user-list/user-list") },
          { path: "perfil", loadComponent: () => import("./pages/perfil-usuario/perfil-usuario") },
          { path: "unidades-saude", loadComponent: () => import("./pages/unidade-saude/unidade-saude")},
          { path: "testes", loadComponent: () => import("./pages/testes-list/testes-list")},
          { path: "home", loadComponent: () => import("./pages/home/home") }
        ]
    },
    { path: "", redirectTo: "login", pathMatch: "full" },
    { path: "**", redirectTo: "login" }
];
