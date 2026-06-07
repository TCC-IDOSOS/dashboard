import { Component, inject, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { UsuariosService } from '../../services/usuarios/usuarios';
import { LoginService } from '../../services/login/login';

@Component({
  selector: 'app-menu-lateral',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './menu-lateral.html',
  styleUrl: './menu-lateral.css',
})
export class MenuLateral implements OnInit{

  loginService = inject(LoginService);
  usuarioService = inject(UsuariosService);

  isProfissional: boolean = false;

  ngOnInit(): void {
    const idUsuario = this.loginService.getIdUsuarioLogado();

    const perfilEmCache = sessionStorage.getItem('USER_PROFILE');
    if (perfilEmCache) {
      this.isProfissional = perfilEmCache === 'Profissional';
    }

    if (idUsuario) {
      this.usuarioService.buscarUsuarioPorId(idUsuario).subscribe({
        next: (dadosRetornados) => {
          this.isProfissional = dadosRetornados.profile === 'Profissional';
          sessionStorage.setItem('USER_PROFILE', dadosRetornados.profile);
        },
        error: (erro) => {
          console.error("Falha ao buscar os usuários: ", erro);
        }
      })
    }
  }

}
