import { Component, signal, inject, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MenuLateral } from '../../components/menu-lateral/menu-lateral';
import { UsuariosService } from '../../services/usuarios/usuarios';
import { TestesService } from '../../services/testes/testesService';
import { UnidadeSaudeService } from '../../services/unidade-saude/unidade-saude-service';
import { forkJoin, of } from 'rxjs';
import { switchMap, map, catchError } from 'rxjs/operators';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

@Component({
  selector: 'app-gerar-relatorio',
  standalone: true,
  imports: [CommonModule, FormsModule, MenuLateral],
  templateUrl: './gerar-relatorio.html'
})
export default class GerarRelatorio implements OnInit {
  private usuarioService = inject(UsuariosService);
  private testesService = inject(TestesService);
  private unidadeSaudeService = inject(UnidadeSaudeService);

  dataInicial = signal('');
  dataFinal = signal('');
  nomeIdoso = signal('');
  unidadeSaude = signal('');
  regiao = signal('');
  idade = signal('');
  isLoading = signal(false);

  unidadesDisponiveis = signal<string[]>([]);

  pacientes = signal<any[]>([]);
  mostrarDropdown = signal(false);

  pacientesFiltrados = computed(() => {
    const termo = this.nomeIdoso().toLowerCase();
    if (!termo || !this.mostrarDropdown()) return [];
    return this.pacientes().filter(p => p.name.toLowerCase().includes(termo));
  });

  ngOnInit(): void {
    this.unidadeSaudeService.listarUnidadesSaude().subscribe({
      next: (unidades) => {
        this.unidadesDisponiveis.set(unidades.map(u => u.name));
      },
      error: (err) => {
        console.error("Erro ao carregar unidades de saúde", err);
        this.unidadesDisponiveis.set([]);
      }
    });

    this.usuarioService.listarPacientes().subscribe({
      next: (usuarios) => {
        this.pacientes.set(usuarios.filter(u => u.profile === 'Paciente'));
      },
      error: (err) => console.error("Erro ao carregar pacientes", err)
    });
  }

  selecionarPaciente(nome: string) {
    this.nomeIdoso.set(nome);
    this.mostrarDropdown.set(false);
  }

  esconderDropdownTimeout() {
    setTimeout(() => this.mostrarDropdown.set(false), 200);
  }

  gerarRelatorio() {
    if (!this.dataInicial()) {
      alert('Favor preencher data inicial');
      return;
    }
    if (!this.dataFinal()) {
      alert('Favor preencher data final');
      return;
    }

    this.isLoading.set(true);

    this.usuarioService.listarPacientes().pipe(
      map(usuarios => {
        let usuariosFiltrados = usuarios;
        if (this.nomeIdoso()) {
          usuariosFiltrados = usuariosFiltrados.filter(u => u.name.toLowerCase().includes(this.nomeIdoso().toLowerCase()));
        }
        if (this.unidadeSaude()) {
          usuariosFiltrados = usuariosFiltrados.filter(u => u.healthUnit?.name === this.unidadeSaude());
        }
        
        if (this.idade()) {
          const idadeFiltro = Number(this.idade());
          usuariosFiltrados = usuariosFiltrados.filter(u => {
            if (!u.birthDate) return false;
            const idadeAtual = this.calcularIdade(u.birthDate, new Date().toISOString());
            return idadeAtual === idadeFiltro;
          });
        }
        
        return usuariosFiltrados;
      }),
      switchMap(usuarios => {
        if (usuarios.length === 0) return of([]);

        const requisicoesUsuarios = usuarios.map(usuario =>
          this.testesService.buscarListaTestesUsuario(usuario.id, usuario.email).pipe(
            switchMap(listaTestes => {
              const testesNoPeriodo = listaTestes.filter(teste => {
                const dataTeste = teste.createdAt.split('T')[0];
                return dataTeste >= this.dataInicial() && dataTeste <= this.dataFinal();
              });

              if (testesNoPeriodo.length === 0) return of([]);

              const requisicoesDetalhes = testesNoPeriodo.map(teste =>
                this.testesService.buscarTesteUsuario(usuario.email, teste.id).pipe(
                  map(detalhe => {
                    let mediaZ = 0;
                    if (teste.testType === 'MARCHA') {
                      let peaksZ: number[] = [];
                      if (detalhe.cycles && detalhe.cycles.length > 0) {
                        peaksZ = detalhe.cycles.map((c: any) => c.w_phoneZ_peak_deg_s ?? 0);
                      } else {
                        const pValues = typeof detalhe.peaks_value_deg_s === 'string' ? JSON.parse(detalhe.peaks_value_deg_s || '[]') : (detalhe.peaks_value_deg_s || []);
                        peaksZ = pValues;
                      }
                      mediaZ = peaksZ.length > 0 ? peaksZ.reduce((a: number, b: number) => a + Math.abs(b), 0) / peaksZ.length : 0;
                    }

                    return {
                      nomePaciente: usuario.name,
                      idade: this.calcularIdade(usuario.birthDate, teste.createdAt),
                      sexo: usuario.genre,
                      tipoTeste: teste.testType === 'MARCHA' ? 'Marcha Estacionária' : teste.testType,
                      dataHora: this.formatarDataParaRelatorio(teste.createdAt),
                      unidadeSaude: usuario.healthUnit.name || 'Não informada',
                      repeticoes: detalhe.repeticoes_completas ?? detalhe.n_peaks ?? (detalhe.peaks_t_s ? detalhe.peaks_t_s.length : 0),
                      alturaMedia: teste.testType === 'MARCHA' ? Number(mediaZ).toFixed(2) : Number(detalhe.altura_media ?? 0).toFixed(2),
                      cadencia: Number(detalhe.cadencia ?? detalhe.cadence_cycles_min ?? 0).toFixed(2),
                      classificacao: detalhe.classificacao || 'Não Avaliado'
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
      next: (dadosAninhados: any[][]) => {
        let dadosFinais = dadosAninhados.flat().filter(d => d !== null);

        let somaUtt = 0, countUtt = 0;
        let somaMarcha = 0, countMarcha = 0;

        dadosFinais.forEach(t => {
          const reps = t.repeticoes || 0;
          if (t.tipoTeste === 'UTT') {
            somaUtt += reps;
            countUtt++;
          } else if (t.tipoTeste === 'Marcha Estacionária') {
            somaMarcha += reps;
            countMarcha++;
          }
        });

        const mediaUtt = countUtt > 0 ? somaUtt / countUtt : 0;
        const mediaMarcha = countMarcha > 0 ? somaMarcha / countMarcha : 0;

        dadosFinais.forEach(t => {
          const reps = t.repeticoes || 0;
          const mediaReferencia = t.tipoTeste === 'UTT' ? mediaUtt : (t.tipoTeste === 'Marcha Estacionária' ? mediaMarcha : 0);

          if (mediaReferencia > 0) {
            if (reps > mediaReferencia * 1.1) {
              t.classificacao = 'Acima da Média';
            } else if (reps < mediaReferencia * 0.9) {
              t.classificacao = 'Abaixo da Média';
            } else {
              t.classificacao = 'Na Média';
            }
          }
        });

        if (dadosFinais.length === 0) {
          alert("Nenhum resultado encontrado para os filtros aplicados.");
        } else {
          this.criarPDF(dadosFinais);
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Erro ao gerar relatório:', err);
        alert('Ocorreu um erro ao processar os dados para o relatório.');
        this.isLoading.set(false);
      }
    });
  }

  private criarPDF(dados: any[]) {
    const doc = new jsPDF();
    autoTable(doc, {
      head: [['Paciente', 'Idade', 'Sexo', 'Teste', 'Data/Hora', 'Unidade', 'Repetições', 'Altura Média', 'Cadência', 'Classificação']],
      body: dados.map(d => [d.nomePaciente, d.idade, d.sexo, d.tipoTeste, d.dataHora, d.unidadeSaude, d.repeticoes, d.alturaMedia, d.cadencia, d.classificacao]),
    });
    doc.save(`relatorio_${new Date().toISOString().split('T')[0]}.pdf`);
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

  private formatarDataParaRelatorio(dataIso: string): string {
    if (!dataIso) return '';
    const d = new Date(dataIso);
    return `${d.toLocaleDateString('pt-BR')} ${d.toLocaleTimeString('pt-BR')}`;
  }
}