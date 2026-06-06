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
  isLoading = signal(true);

  @ViewChild('modalDetalhe') modalDetalhe!: ResultadoTesteComponent;

  ngOnInit(): void {
    const idUsuarioLogado = this.loginService.getIdUsuarioLogado();
    
    if (!idUsuarioLogado) {
      this.isLoading.set(false);
      return;
    }

    this.isLoading.set(true);
    this.usuarioService.buscarUsuarioPorId(idUsuarioLogado).pipe(
      switchMap(usuarioLogado => {
        return this.route.queryParams.pipe(
          switchMap(params => {
            const email = params['email'] || '';
            const userId = params['id'];

            if (usuarioLogado.profile === 'Paciente') {
              return of([usuarioLogado]);
            } else {
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
                    map(detalhe => {
                      
                      const pValues = typeof detalhe.peaks_value_deg_s === 'string' ? JSON.parse(detalhe.peaks_value_deg_s || '[]') : (detalhe.peaks_value_deg_s || []);
                      const pTimes = typeof detalhe.peaks_t_s === 'string' ? JSON.parse(detalhe.peaks_t_s || '[]') : (detalhe.peaks_t_s || []);

                      let ciclosMapeados: any[] = [];

                      console.warn(teste)
                      
                      if (teste.testType === 'MARCHA') {
                        if (detalhe.cycles && detalhe.cycles.length > 0) {
                          ciclosMapeados = detalhe.cycles.map((c: any, i: number) => ({
                            ciclo: c.peak_idx ?? (i + 1),
                            amplitude_cm: c.w_phoneZ_peak_deg_s ?? 0, 
                            tempo_ciclo_s: c.t_peak_s ?? 0,
                            velocidade_subida_cm_s: 0,
                            tempo_subida_s: 0,
                            potencia_w: 0,
                            trabalho_j: 0
                          }));
                        } else {
                          ciclosMapeados = pValues.map((val: number, i: number) => ({
                            ciclo: i + 1,
                            amplitude_cm: val,
                            tempo_ciclo_s: pTimes[i] || 0,
                            velocidade_subida_cm_s: 0,
                            tempo_subida_s: 0,
                            potencia_w: 0,
                            trabalho_j: 0
                          }));
                        }
                      } else {
                        ciclosMapeados = detalhe.cycles || [];
                      }
                      if(teste.id == 27) {
                        console.warn(`[API] Detalhes originais do Teste ${teste.id}:`, detalhe);
                      console.warn(`[MAPEADO] Ciclos gerados do Teste ${teste.id}:`, ciclosMapeados);
                      }

                      const mediaZ = ciclosMapeados.length > 0 
                        ? ciclosMapeados.reduce((acc: number, c: any) => acc + Math.abs(c.amplitude_cm || 0), 0) / ciclosMapeados.length 
                        : 0;

                      return {
                      id: teste.id,
                      nomeTeste: teste.testType === 'MARCHA' ? 'Marcha Estacionária' : teste.testType,
                      testType: teste.testType,
                      dataHora: this.formatarData(teste.createdAt),
                      dataOriginal: teste.createdAt,
                      
                      paciente: usuario.name, 
                      cpf: this.formatarCpf(usuario.cpf),
                      idade: this.calcularIdade(usuario.birthDate, teste.createdAt),
                      quedas: (usuario as any).qtdQuedas || 0,
                      profissional: 'Avaliador', 
                      unidade: usuario.healthUnit?.name || 'Não informada',

                      repeticoes: detalhe.repeticoes_completas ?? detalhe.n_peaks ?? (detalhe.peaks_t_s ? detalhe.peaks_t_s.length : 0),
                      alturaMedia: teste.testType === 'MARCHA' ? Number(mediaZ).toFixed(2) : Number(detalhe.altura_media ?? 0).toFixed(2),
                      cadencia: Number(detalhe.cadencia ?? detalhe.cadence_cycles_min ?? 0).toFixed(2),
                      classificacao: detalhe.classificacao || 'Não Avaliado',
                        cycles: ciclosMapeados,

                      nomeProfissional: 'Avaliador',
                      unidadeSaude: usuario.healthUnit?.name || 'Não informada',
                      avaliador: {
                        nome: 'Avaliador',
                        unidade: usuario.healthUnit?.name || 'Não informada',
                        dataHora: teste.createdAt
                      },
                        metricas: {
                          ...detalhe,
                          cycles: ciclosMapeados
                        }
                      };
                    }),
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
          
          let somaUtt = 0, countUtt = 0;
          let somaMarcha = 0, countMarcha = 0;

          testesValidos.forEach(t => {
            const reps = t.repeticoes || 0;
            if (t.testType === 'UTT') {
              somaUtt += reps;
              countUtt++;
            } else if (t.testType === 'MARCHA') {
              somaMarcha += reps;
              countMarcha++;
            }
          });

          const mediaUtt = countUtt > 0 ? somaUtt / countUtt : 0;
          const mediaMarcha = countMarcha > 0 ? somaMarcha / countMarcha : 0;

          testesValidos.forEach(t => {
            const reps = t.repeticoes || 0;
            const mediaReferencia = t.testType === 'UTT' ? mediaUtt : (t.testType === 'MARCHA' ? mediaMarcha : 0);

            if (mediaReferencia > 0) {
              if (reps > mediaReferencia * 1.1) {
                t.classificacao = 'Acima da Média';
              } else if (reps < mediaReferencia * 0.9) {
                t.classificacao = 'Abaixo da Média';
              } else {
                t.classificacao = 'Na Média';
              }
            }
            
            if (t.metricas) { t.metricas.classificacao = t.classificacao; }
          });

          testesValidos.sort((a, b) => new Date(b.dataOriginal).getTime() - new Date(a.dataOriginal).getTime());

          this.testes.set(testesValidos);
          this.isLoading.set(false);
        },
        error: (err) => {
          console.error('Erro ao montar os dados da tabela:', err);
          this.isLoading.set(false);
        }
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

  private calcularIdade(dataNascimento: string | Date, dataTeste: string): number {
    if (!dataNascimento) return 0;
    const nascimento = new Date(dataNascimento);
    const teste = new Date(dataTeste);
    let idade = teste.getFullYear() - nascimento.getFullYear();
    const m = teste.getMonth() - nascimento.getMonth();
    if (m < 0 || (m === 0 && teste.getDate() < nascimento.getDate())) {
      idade--;
    }
    return idade;
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