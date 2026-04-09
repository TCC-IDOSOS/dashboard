import { Component, inject, OnInit, signal } from '@angular/core';
import { UnidadeSaudeModalComponent } from '../../components/unidade-saude-modal/unidade-saude-modal';
import { UnidadeSaude } from '../../shared/interfaces/unidade-saude.interface';
import { MenuLateral } from '../../components/menu-lateral/menu-lateral';
import { UnidadeSaudeService } from '../../services/unidade-saude/unidade-saude-service';

@Component({
  selector: 'app-unidade-saude-list',
  standalone: true,
  imports: [UnidadeSaudeModalComponent, MenuLateral],
  templateUrl: './unidade-saude.html'
})
export default class UnidadeSaudeComponent implements OnInit{
  
  unidades = signal<UnidadeSaude[]>([]);

  modalAberto = signal(false);
  unidadeSelecionada = signal<UnidadeSaude | null>(null);

  unidadeSaudeService = inject(UnidadeSaudeService)


  ngOnInit(): void {
    this.carregarUnidadesSaude();
  }

  carregarUnidadesSaude() {
    this.unidadeSaudeService.listarUnidadesSaude().subscribe({
      next: (dadosRetornados) => {
        console.warn(dadosRetornados)
        this.unidades.set(dadosRetornados); 
      },
      error: (erro) => {
        console.error("Falha ao buscar as unidades de saúde: ", erro);
      }
    })
  }

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
   this.unidadeSaudeService.excluirUnidadeSaude(id).subscribe({
    next: () => {
      alert('Unidade excluída com sucesso!');
      this.carregarUnidadesSaude();
    }
   })
  }

  recarregarLista() {
    console.log('Atualizando a lista...');
    this.fecharModal();
  }
}