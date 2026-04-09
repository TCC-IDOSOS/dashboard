import { Component, inject, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { UsuariosService } from '../../services/usuarios/usuarios';
import { LoginService } from '../../services/login/login';

@Component({
  selector: 'app-menu-lateral',
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
    console.log(this.isProfissional, idUsuario);
    if (idUsuario) {
      this.usuarioService.buscarUsuarioPorId(idUsuario).subscribe({
        next: (dadosRetornados) => {
          this.isProfissional = dadosRetornados.profile === 'Profissional';
          console.log(this.isProfissional);
        },
        error: (erro) => {
          console.error("Falha ao buscar os usuários: ", erro);
        }
      })
    }
  }

}
