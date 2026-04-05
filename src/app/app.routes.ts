import { Routes } from '@angular/router';

export const routes: Routes = [
    { path: "", redirectTo: "login", pathMatch: "full" },
    { path: "usuarios", loadComponent: () => import("./pages/user-list/user-list") },
    { path: "perfil", loadComponent: () => import("./pages/perfil-usuario/perfil-usuario") },
    { path: "login", loadComponent: () => import("./pages/login/login") },
    { path: "unidades-saude", loadComponent: () => import("./pages/unidade-saude/unidade-saude") 
      },
];
