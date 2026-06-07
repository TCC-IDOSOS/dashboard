import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; 
import { UserModalComponent } from '../../components/user-modal/user-modal';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { MenuLateral } from '../../components/menu-lateral/menu-lateral';
import { UsuariosService } from '../../services/usuarios/usuarios';
import { Paciente, Usuario } from '../../shared/interfaces/usuario.interface';
import { Operacao } from '../../shared/interfaces/operacao.enum';
import { LoginService } from '../../services/login/login';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [CommonModule, FormsModule, UserModalComponent, MenuLateral ],
  templateUrl: './user-list.html'
})
export default class UserListComponent implements OnInit{

  private router = inject(Router);

  termoPesquisa = signal('');
  modalAberto = signal(false);

  criarEditarUsuario = signal<Operacao.CRIAR| Operacao.EDITAR>(Operacao.CRIAR)

  usuarios = signal<Usuario[]>([]);
  usuarioSelecionado = signal<Usuario | null>(null);

  usuarioService = inject(UsuariosService);
  loginService = inject(LoginService)
  isPacienteLogado = signal<boolean>(false);

  ngOnInit(): void {
    this.carregarUsuarios();

    const idUsuario = this.loginService.getIdUsuarioLogado();
    
    if (idUsuario) {
      this.usuarioService.buscarUsuarioPorId(idUsuario).subscribe({
        next: (dadosRetornados) => {
          if (dadosRetornados.profile !== 'Profissional') {
            this.router.navigate(['/testes']);
            return;
          }

          this.isPacienteLogado.set(false);
        },
        error: (erro) => {
          console.error("Falha ao buscar os dados do usuário logado: ", erro);
        }
      })
    }
  }

  carregarUsuarios() {
    this.usuarioService.listarPacientes().subscribe({
      next: (dadosRetornados) => {
        this.usuarios.set(dadosRetornados); 
      },
      error: (erro) => {
        console.error("Falha ao buscar os usuários: ", erro);
      }
    })
  }

  novoUsuario() {
    this.usuarioSelecionado.set(null);
    this.modalAberto.set(true);
    this.criarEditarUsuario.set(Operacao.CRIAR);
  }

  fecharModal() {
    this.modalAberto.set(false);
  }

  editarUsuario(usuario: Usuario) {
    this.modalAberto.set(true);
    this.usuarioSelecionado.set(usuario);
    this.criarEditarUsuario.set(Operacao.EDITAR);
  }

  visualizarTestes(usuario: Usuario) {
    this.router.navigate(['/testes'], { queryParams: { email: usuario.email, id: usuario.id }});
  }

  excluirUsuario(usuario: Usuario) {
    this.usuarioService.deletarUsuario(usuario.id).subscribe({
      next: () => {
        alert('Usuário excluído com sucesso!');
        this.carregarUsuarios();
      }
    })
  }

  recarregarLista() {
    this.fecharModal();
  }

  formatarCpf(cpf: string): string {
    if (!cpf) return '';
    const numeros = cpf.replace(/\D/g, '');
    if (numeros.length !== 11) return cpf;
    return numeros.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }

  usuariosFiltrados = computed(() => {
    const termo = this.termoPesquisa().toLowerCase();
    return this.usuarios().filter(u => 
      u.name.toLowerCase().includes(termo) ||
      u.cpf.includes(termo)
    );
  });

}