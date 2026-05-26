import { Component, inject, signal, computed, OnInit, effect, ViewChild } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MenuLateral } from '../../components/menu-lateral/menu-lateral';
import { TestesService } from '../../services/testes/testesService';
import { catchError, forkJoin, map, of, switchMap } from 'rxjs';
import { UsuariosService } from '../../services/usuarios/usuarios';
import { ResultadoTesteComponent } from '../resultado-teste/resultado-teste';
import { LoginService } from '../../services/login/login';
import { FiltroDataModalComponent } from './filtro-data-modal';

@Component({
  selector: 'app-testes-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, MenuLateral, ResultadoTesteComponent, FiltroDataModalComponent],
  templateUrl: './testes-list.html'
})
export default class TestesListComponent implements OnInit {

  private router = inject(Router);
  private route = inject(ActivatedRoute);
  testesService = inject(TestesService);
  usuarioService = inject(UsuariosService);
  loginService = inject(LoginService);

  termoPesquisa = signal('');

  testes = signal<any[]>([]);
  modalFiltroAberto = signal(false);
  dataInicioFiltro = signal<string>('');
  dataFimFiltro = signal<string>('');

  @ViewChild('modalDetalhe') modalDetalhe!: ResultadoTesteComponent;

  ngOnInit(): void {
    const idUsuarioLogado = this.loginService.getIdUsuarioLogado();
    
    if (!idUsuarioLogado) return;

    this.usuarioService.buscarUsuarioPorId(idUsuarioLogado).pipe(
      switchMap(usuarioLogado => {
        return this.route.queryParams.pipe(
          switchMap(params => {
            const email = params['email'] || '';
            const userId = params['id'];

            if (usuarioLogado.profile === 'Paciente') {
              // Se for paciente, injeta ele mesmo como o único alvo da busca de testes
              return of([usuarioLogado]);
            } else {
              // Se for profissional/admin, segue o fluxo normal (queryParams ou todos)
              return (email && userId)
                ? this.usuarioService.buscarUsuarioPorId(userId).pipe(map(u => [u]))
                : this.usuarioService.listarPacientes();
            }
          })
        );
      }),
        switchMap(usuarios => {
          if (!usuarios || usuarios.length === 0) {
            return of([]); 
          }

          const requisicoesUsuarios = usuarios.map(usuario => 
            this.testesService.buscarListaTestesUsuario(usuario.id, usuario.email).pipe(
              switchMap(listaTestes => {
                if (!listaTestes || listaTestes.length === 0) {
                  return of([]); 
                }

                const requisicoesDetalhes = listaTestes.map(teste => 
                  this.testesService.buscarTesteUsuario(usuario.email, teste.id).pipe(
                    map(detalhe => ({
                      id: teste.id,
                      nomeTeste: teste.testType === 'MARCHA' ? 'Marcha Estacionária' : teste.testType,
                      dataHora: this.formatarData(teste.createdAt),
                      dataOriginal: teste.createdAt,
                      
                      paciente: usuario.name, 
                      cpf: this.formatarCpf(usuario.cpf),
                      profissional: 'Avaliador', 
                      unidade: usuario.healthUnit?.name || 'Não informada',

                      repeticoes: detalhe.repeticoes_completas || 0,
                      alturaMedia: Number(detalhe.altura_media || 0).toFixed(2),
                      cadencia: Number(detalhe.cadencia || 0).toFixed(2),
                      classificacao: detalhe.classificacao || 'Não Avaliado',
                      cycles: detalhe.cycles || [],

                      nomeProfissional: 'Avaliador',
                      unidadeSaude: usuario.healthUnit?.name || 'Não informada',
                      avaliador: {
                        nome: 'Avaliador',
                        unidade: usuario.healthUnit?.name || 'Não informada',
                        dataHora: teste.createdAt
                      },
                      metricas: detalhe
                    })),
                    catchError(() => of(null)) 
                  )
                );

                return forkJoin(requisicoesDetalhes);
              }),
              catchError(() => of([]))
            )
          );

          return forkJoin(requisicoesUsuarios);
        })
      ).subscribe({
        next: (dadosCompletos: any[]) => {
          const testesValidos = dadosCompletos.flat().filter(d => d !== null);
          
          testesValidos.sort((a, b) => new Date(b.dataOriginal).getTime() - new Date(a.dataOriginal).getTime());

          this.testes.set(testesValidos);
        },
        error: (err) => console.error('Erro ao montar os dados da tabela:', err)
      });
  }

  private formatarData(dataIso: string): string {
    if (!dataIso) return '';
    const dateObj = new Date(dataIso);
    const dia = String(dateObj.getDate()).padStart(2, '0');
    const mes = String(dateObj.getMonth() + 1).padStart(2, '0');
    const ano = String(dateObj.getFullYear()).slice(-2);
    const horas = String(dateObj.getHours()).padStart(2, '0');
    const minutos = String(dateObj.getMinutes()).padStart(2, '0');
    return `${dia}/${mes}/${ano} | ${horas}h${minutos}`;
  }

  private formatarCpf(cpf: string): string {
    if (!cpf) return '';
    const numeros = cpf.replace(/\D/g, '');
    if (numeros.length !== 11) return cpf;
    return numeros.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }

  testesFiltrados = computed(() => {
    const termo = this.termoPesquisa().toLowerCase();
    const inicio = this.dataInicioFiltro();
    const fim = this.dataFimFiltro();

    let lista = this.testes();

    if (inicio || fim) {
      lista = lista.filter(t => {
        if (!t.dataOriginal) return false;
        const dataTesteStr = t.dataOriginal.split('T')[0];
        
        if (inicio && dataTesteStr < inicio) return false;
        if (fim && dataTesteStr > fim) return false;
        return true;
      });
    }

    if (termo) {
      lista = lista.filter(t => 
        t?.nomeTeste?.toLowerCase().includes(termo) ||
        t?.classificacao?.toLowerCase().includes(termo) ||
        t?.paciente?.toLowerCase().includes(termo) ||
        t?.cpf?.includes(termo)
      );
    }

    return lista;
  });

  verDetalhes(testeId: number) {
    const testeSelecionado = this.testes().find(t => t.id === testeId);
    
    const dadosModal = {
      ...testeSelecionado,
      dataHora: testeSelecionado.dataOriginal
    };

    this.modalDetalhe.abrir(dadosModal);
  }

  gerarRelatorio() {
    alert('Relatório gerado com sucesso! (Integração com PDF em breve)');
  }

  abrirFiltros() {
    this.modalFiltroAberto.set(true);
  }

  fecharFiltros() {
    this.modalFiltroAberto.set(false);
  }

  aplicarFiltroData(datas: { inicio: string, fim: string }) {
    this.dataInicioFiltro.set(datas.inicio);
    this.dataFimFiltro.set(datas.fim);
    this.fecharFiltros();
  }
}