import { Routes } from '@angular/router';

export const routes: Routes = [
    { path: "", redirectTo: "usuarios", pathMatch: "full" },
    { path: "usuarios", loadComponent: () => import("./pages/user-list/user-list") },
    { path: "perfil", loadComponent: () => import("./pages/perfil-usuario/perfil-usuario") },
];
