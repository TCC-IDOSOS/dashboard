import { Component, signal } from '@angular/core';
import { UnidadeSaudeModalComponent } from '../../components/unidade-saude-modal/unidade-saude-modal';
import { UnidadeSaude } from '../../shared/interfaces/unidade-saude.interface';
import { MenuLateral } from '../../components/menu-lateral/menu-lateral';

@Component({
  selector: 'app-unidade-saude-list',
  standalone: true,
  imports: [UnidadeSaudeModalComponent, MenuLateral],
  templateUrl: './unidade-saude.html'
})
export default class UnidadeSaudeComponent {
  
  unidades = signal<UnidadeSaude[]>([
    { id: 1, nome: 'US Centro', rua: 'Rua Principal', numero: '12', bairro: 'Centro', cidade: 'Curitiba', uf: 'PR', cep: '01000-000', cnpj: '12.345.678/0001-90' },
    { id: 2, nome: 'US Bairro Alto', rua: 'Av. das Torres', numero: '500', bairro: 'Bairro Alto', cidade: 'Curitiba', uf: 'PR', cep: '82000-000', cnpj: '98.765.432/0001-10' }
  ]);

  modalAberto = signal(false);
  unidadeSelecionada = signal<UnidadeSaude | null>(null);

  abrirModalNovaUnidade() {
    this.unidadeSelecionada.set(null); 
    this.modalAberto.set(true);
  }

  abrirModalEdicao(unidade: UnidadeSaude) {
    this.unidadeSelecionada.set(unidade);
    this.modalAberto.set(true);
  }

  fecharModal() {
    this.modalAberto.set(false);
  }

  excluirUnidade(id: any) {
    if(confirm('Tem certeza que deseja excluir esta unidade?')) {
      console.log('Vai chamar o service de exclusão para o ID:', id);
    }
  }

  recarregarLista() {
    console.log('Atualizando a lista...');
    this.fecharModal();
  }
}