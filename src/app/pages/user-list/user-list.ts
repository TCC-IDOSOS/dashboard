import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; 
import { UserModalComponent } from '../../components/user-modal/user-modal';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MenuLateral } from '../../components/menu-lateral/menu-lateral';

// Interface baseada nos dados do wireframe
export interface Usuario {
  id: number;
  nome: string;
  quedas: number;
  cpf: string;
  tipo: 'Paciente' | 'Profissional';
  email: string;
}

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [CommonModule, FormsModule, UserModalComponent, MenuLateral ],
  templateUrl: './user-list.html'
})
export default class UserListComponent {

  usuarios = signal<Usuario[]>([
    { id: 1, nome: 'Maria Silva', quedas: 2, cpf: '109.443.124-00', tipo: 'Paciente', email: 'cristhian.jdhs@gmail.com' },
    { id: 2, nome: 'DR. Jose da Silva', quedas: 0, cpf: '109.443.124-00', tipo: 'Profissional', email: 'cristhian.jdhs@gmail.com' },
    { id: 3, nome: 'Maria Silva', quedas: 2, cpf: '109.443.124-00', tipo: 'Paciente', email: 'cristhian.jdhs@gmail.com' },
  ]);

  termoPesquisa = signal('');
  modalAberto = signal(false);

  usuariosFiltrados = computed(() => {
    const termo = this.termoPesquisa().toLowerCase();
    return this.usuarios().filter(u => 
      u.nome.toLowerCase().includes(termo) ||
      u.cpf.includes(termo) ||
      u.email.toLowerCase().includes(termo)
    );
  });

  novoUsuario() {
    this.modalAberto.set(true);
  }

  fecharModal() {
    this.modalAberto.set(false);
  }

  editarUsuario(usuario: Usuario) {
    console.log('Abrindo tela "Manter Usuário" com os dados:', usuario);
  }

  visualizarTestes(usuario: Usuario) {
    console.log('Navegando para "Listar teste" do usuário:', usuario.id);
  }

  excluirUsuario(usuario: Usuario) {
    if (confirm(`Tem certeza que deseja excluir o usuário ${usuario.nome}?`)) {
      this.usuarios.update(lista => lista.filter(u => u.id !== usuario.id));
      console.log('Usuário excluído com sucesso.');
    }
  }
}