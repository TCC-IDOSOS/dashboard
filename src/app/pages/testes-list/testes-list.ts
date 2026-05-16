import { Component, inject, signal, computed, OnInit, effect, ViewChild } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MenuLateral } from '../../components/menu-lateral/menu-lateral';
import { TestesService } from '../../services/testes/testesService';
import { TesteListagem } from '../../shared/interfaces/testes.interface';
import { catchError, forkJoin, map, of, switchMap } from 'rxjs';
import { UsuariosService } from '../../services/usuarios/usuarios';
import { ResultadoTesteComponent } from '../resultado-teste/resultado-teste';

@Component({
  selector: 'app-testes-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, MenuLateral, ResultadoTesteComponent],
  templateUrl: './testes-list.html'
})
export default class TestesListComponent implements OnInit {
  
  constructor() {
    effect(() => {
      console.warn(this.testes(), "testes atualizados reactivamente (effect)");
    });
  }

  private router = inject(Router);
  private route = inject(ActivatedRoute);
  testesService = inject(TestesService);
  usuarioService = inject(UsuariosService);

  termoPesquisa = signal('');

  testes = signal<any[]>([]);

  @ViewChild('modalDetalhe') modalDetalhe!: ResultadoTesteComponent;

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const email = params['email'] || '';
      const userId = params['id'];

      if (!email || !userId) {
        return;
      }

      forkJoin({
        usuario: this.usuarioService.buscarUsuarioPorId(userId),
        listaTestes: this.testesService.buscarListaTestesUsuario(userId, email)
      }).pipe(
        switchMap(({ usuario, listaTestes }) => {
          if (!listaTestes || listaTestes.length === 0) {
            return of([]); 
          }

          const requisicoesDetalhes = listaTestes.map(teste => 
            this.testesService.buscarTesteUsuario(email, teste.id).pipe(
              map(detalhe => ({
                id: teste.id,
                nomeTeste: teste.testType === 'MARCHA' ? 'Marcha Estacionária' : teste.testType,
                dataHora: teste.createdAt,
                
                paciente: usuario.name, 
                cpf: usuario.cpf,
                profissional: 'Avaliador', 
                unidade: usuario.unidadeSaude || 'Não informada',

                repeticoes: detalhe.repeticoes_completas || 0,
                alturaMedia: detalhe.altura_media || 0,
                cadencia: detalhe.cadencia || 0,
                classificacao: detalhe.classificacao || 'Não Avaliado',
                cycles: detalhe.cycles || 0
              })),
              catchError(() => of(null)) 
            )
          );

          return forkJoin(requisicoesDetalhes);
        })
      ).subscribe({
      next: (dadosCompletos: any[]) => {
        const testesValidos = dadosCompletos.filter(d => d !== null);
        this.testes.set(testesValidos);
        },
        error: (err) => console.error('Erro ao montar os dados da tabela:', err)
      });
    });
  }

  testesFiltrados = computed(() => {
    const termo = this.termoPesquisa().toLowerCase();
    if (!termo) return this.testes();

  return this.testes().filter(t => 
    t?.nomeTeste?.toLowerCase().includes(termo) ||
    t?.classificacao?.toLowerCase().includes(termo)
  );
  });

  verDetalhes(testeId: number) {
    const testeSelecionado = this.testes().find(t => t.id === testeId);

    this.modalDetalhe.abrir(testeSelecionado);
  }

  gerarRelatorio() {
    console.log('Gerando relatório com os testes listados:', this.testesFiltrados());
    alert('Relatório gerado com sucesso! (Integração com PDF em breve)');
  }

  abrirFiltros() {
    console.log('Abrir modal/menu de filtros complexos');
  }
}