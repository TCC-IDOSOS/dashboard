import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; 
import { UserModalComponent } from '../../components/user-modal/user-modal';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MenuLateral } from '../../components/menu-lateral/menu-lateral';
import { UsuariosService } from '../../services/usuarios';
import { Paciente, Usuario } from '../../shared/interfaces/usuario.interface';
import { Operacao } from '../../shared/interfaces/operacao.enum';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [CommonModule, FormsModule, UserModalComponent, MenuLateral ],
  templateUrl: './user-list.html'
})
export default class UserListComponent implements OnInit{

  termoPesquisa = signal('');
  modalAberto = signal(false);

  criarEditarUsuario = signal<Operacao.CRIAR_USUARIO | Operacao.EDITAR_USUARIO>(Operacao.CRIAR_USUARIO)

  usuarios = signal<Usuario[]>([]);
  usuarioSelecionado = signal<Usuario | null>(null);

  usuarioService = inject(UsuariosService);

  ngOnInit(): void {
    this.carregarUsuarios();
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
    this.criarEditarUsuario.set(Operacao.CRIAR_USUARIO);
  }

  fecharModal() {
    this.modalAberto.set(false);
  }

  editarUsuario(usuario: Usuario) {
    this.modalAberto.set(true);
    this.usuarioSelecionado.set(usuario);
    this.criarEditarUsuario.set(Operacao.EDITAR_USUARIO);
    console.log('Abrindo tela "Manter Usuário" com os dados:', usuario);
  }

  visualizarTestes(usuario: Usuario) {
    console.log('Navegando para "Listar teste" do usuário:', usuario.id);
  }

  excluirUsuario(usuario: Usuario) {
    console.log('Exlcuir usuario');
  }

  usuariosFiltrados = computed(() => {
    const termo = this.termoPesquisa().toLowerCase();
    return this.usuarios().filter(u => 
      u.name.toLowerCase().includes(termo) ||
      u.cpf.includes(termo)
    );
  });

}