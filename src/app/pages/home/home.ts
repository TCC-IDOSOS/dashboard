import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MenuLateral } from '../../components/menu-lateral/menu-lateral';
import { DashboardService } from '../../services/dashboard/dashboardService';
import { UnidadeSaudeService } from '../../services/unidade-saude/unidade-saude-service';
import { UsuariosService } from '../../services/usuarios/usuarios';
import { TestesService } from '../../services/testes/testesService';
import { switchMap, forkJoin, map, of, catchError } from 'rxjs';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule, MenuLateral],
  templateUrl: './home.html'
})
export default class HomeComponent implements OnInit {

  totalPacientes = signal(0);
  testesNoPeriodo = signal(0);
  classificacao = signal({
    acima: 40,
    media: 35,
    abaixo: 25
  });

  totalPorTipo = signal([
    { label: '2MST', valor: 0, percent: 0 },
    { label: 'UTT', valor: 0, percent: 0 }
  ]);

  filtrosAtivos = signal(['Região']);
  distribuicao = signal<{label: string, valor: number, percent: number}[]>([]);

  filtroClassificacao = signal('UTT');
  todosTestesCadastrados = signal<any[]>([]);

  filtroPeriodoTestes = signal('Mês atual');
  opcoesPeriodo = ['Mês atual', 'Últimos 30 dias', 'Últimos 3 meses', 'Este ano'];

  pontosGraficoLinha = signal('0,150 200,80 400,120 600,40 800,100 1000,20');
  dadosGraficoLinha = signal<{x: number, y: number, percentX: number, valor: number, label: string}[]>([]);

  dashboardService = inject(DashboardService);
  unidadeSaudeService = inject(UnidadeSaudeService);
  usuarioService = inject(UsuariosService);
  testesService = inject(TestesService);

  ngOnInit(): void {
    this.carregarUnidadesSaude();

    this.dashboardService.obterEstatisticas().subscribe({
      next: (stats) => {
        this.totalPacientes.set(stats.totalPatients);
        if (this.todosTestesCadastrados().length === 0) {
          this.testesNoPeriodo.set(stats.testsLast30Days);
        }
      },
      error: (erro) => {
        console.error("Falha ao buscar estatísticas: ", erro);
      }
    });
  }
  
  carregarUnidadesSaude(): void {
    this.unidadeSaudeService.listarUnidadesSaude().subscribe({
      next: (unidades) => {
        const distribuicaoUnidades = unidades.map(unidade => ({
          label: unidade.name,
          valor: 0, 
          percent: 0
        }));
        this.distribuicao.set(distribuicaoUnidades);
        
        this.buscarTestesPorPaciente();
      },
      error: (erro) => {
        console.error("Falha ao buscar as unidades de saúde: ", erro);
      }
    });
  }

  buscarTestesPorPaciente(): void {
    this.usuarioService.listarPacientes().pipe(
      switchMap(usuarios => {
        const pacientes = usuarios ? usuarios.filter(u => u.profile === 'Paciente') : [];
        
        if (pacientes.length === 0) return of([]);
        
        const requisicoes = pacientes.map(p => 
          this.testesService.buscarListaTestesUsuario(p.id, p.email).pipe(
            map(testes => ({
              nome: p.name,
              cpf: p.cpf,
              unidadeSaude: p.healthUnit?.name || 'Não informada',
              quantidadeTestes: testes ? testes.length : 0,
              datasTestes: testes ? testes.map((t: any) => t.createdAt || t.testDateTime || t.dataHora) : [],
              listaTestes: (testes || []).map((t: any) => ({ ...t, unidadeSaude: p.healthUnit?.name || 'Não informada' }))
            })),
            catchError(() => of({ nome: p.name, cpf: p.cpf, unidadeSaude: p.healthUnit?.name || 'Não informada', quantidadeTestes: 0, datasTestes: [], listaTestes: [] }))
          )
        );
        return forkJoin(requisicoes);
      })
    ).subscribe(resultado => {
      const ultimos6Meses: string[] = [];
      const labels: string[] = [];
      const mesesNomes = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      const dataAtual = new Date();
      for (let i = 5; i >= 0; i--) {
        const d = new Date(dataAtual.getFullYear(), dataAtual.getMonth() - i, 1);
        const mesAno = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        ultimos6Meses.push(mesAno);
        labels.push(mesesNomes[d.getMonth()]);
      }
      
      const contagemMeses: Record<string, number> = {};
      ultimos6Meses.forEach(m => contagemMeses[m] = 0);

      resultado.forEach(paciente => {
        paciente.datasTestes?.forEach((data: any) => {
          if (!data) return;
          const d = new Date(data);
          const mesAno = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
          if (contagemMeses[mesAno] !== undefined) {
            contagemMeses[mesAno]++;
          }
        });
      });

      const valoresMeses = ultimos6Meses.map(m => contagemMeses[m]);
      const maxMes = Math.max(...valoresMeses, 1);

      const dadosLinha = valoresMeses.map((valor, index) => {
        const x = index * 200; 
        const y = 190 - (valor / maxMes) * 170; 
        const percentX = (index / 5) * 100;
        return { x, y, percentX, valor, label: labels[index] };
      });

      this.pontosGraficoLinha.set(dadosLinha.map(d => `${d.x},${d.y}`).join(' '));
      this.dadosGraficoLinha.set(dadosLinha);

      this.todosTestesCadastrados.set(resultado.flatMap(r => r.listaTestes));
      this.calcularClassificacao();
      this.calcularTestesNoPeriodo();
      this.calcularTotalPorTipo();
      this.calcularDistribuicao();
    });
  }

  calcularTotalPorTipo() {
    const testes = this.todosTestesCadastrados();
    const testesNoPeriodo = this.filtrarTestesPorPeriodo(testes);

    let marcha = 0;
    let utt = 0;

    testesNoPeriodo.forEach((t: any) => {
      if (t.testType === 'MARCHA') marcha++;
      else if (t.testType === 'UTT') utt++;
    });

    const maxVal = Math.max(marcha, utt, 1); 

    this.totalPorTipo.set([
      { label: '2MST', valor: marcha, percent: Math.round((marcha / maxVal) * 100) },
      { label: 'UTT', valor: utt, percent: Math.round((utt / maxVal) * 100) }
    ]);
  }

  calcularTestesNoPeriodo() {
    const testes = this.todosTestesCadastrados();
    const testesNoPeriodo = this.filtrarTestesPorPeriodo(testes);
    this.testesNoPeriodo.set(testesNoPeriodo.length);
  }

  calcularDistribuicao() {
    const testes = this.todosTestesCadastrados();
    const testesNoPeriodo = this.filtrarTestesPorPeriodo(testes);

    const agrupadoPorUnidade = testesNoPeriodo.reduce((acc: Record<string, number>, curr: any) => {
      const unidade = (curr.unidadeSaude || 'Não informada').trim();
      acc[unidade] = (acc[unidade] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    this.distribuicao.update(dist => {
      const novaDistribuicao = dist.map(d => ({
        ...d,
        valor: agrupadoPorUnidade[d.label.trim()] || 0
      }));

      const maxVal = Math.max(...novaDistribuicao.map(d => d.valor), 1); 

      return novaDistribuicao.map(d => ({
        ...d,
        percent: Math.round((d.valor / maxVal) * 100)
      }));
    });
  }

  filtrarTestesPorPeriodo(testes: any[]): any[] {
    const filtro = this.filtroPeriodoTestes();
    const hoje = new Date();

    return testes.filter((t: any) => {
      const dataTeste = new Date(t.createdAt || t.testDateTime || t.dataHora);
      if (isNaN(dataTeste.getTime())) return false;

      if (filtro === 'Mês atual') {
        return dataTeste.getMonth() === hoje.getMonth() && dataTeste.getFullYear() === hoje.getFullYear();
      } else if (filtro === 'Últimos 30 dias') {
        const trintaDiasAtras = new Date();
        trintaDiasAtras.setDate(hoje.getDate() - 30);
        return dataTeste >= trintaDiasAtras;
      } else if (filtro === 'Últimos 3 meses') {
        const tresMesesAtras = new Date(hoje.getFullYear(), hoje.getMonth() - 3, hoje.getDate());
        return dataTeste >= tresMesesAtras;
      } else if (filtro === 'Este ano') {
        return dataTeste.getFullYear() === hoje.getFullYear();
      }
      return true;
    });
  }

  mudarFiltroPeriodo(filtro: string) {
    this.filtroPeriodoTestes.set(filtro);
    this.calcularTestesNoPeriodo();
    this.calcularTotalPorTipo();
    this.calcularDistribuicao();
  }

  calcularClassificacao() {
    const testes = this.todosTestesCadastrados();
    const filtro = this.filtroClassificacao();

    let somaUtt = 0, countUtt = 0;
    let somaMarcha = 0, countMarcha = 0;

    testes.forEach((t: any) => {
      const reps = t.totalRepetitionsApp || 0;
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

    let acima = 0, media = 0, abaixo = 0;

    testes.forEach((t: any) => {
      if (filtro !== 'Todos' && t.testType !== filtro) return;

      const reps = t.totalRepetitionsApp || 0;
      const mediaReferencia = t.testType === 'UTT' ? mediaUtt : (t.testType === 'MARCHA' ? mediaMarcha : 0);

      if (mediaReferencia === 0) return;

      if (reps > mediaReferencia * 1.1) { acima++; } 
      else if (reps < mediaReferencia * 0.9) { abaixo++; } 
      else { media++; }
    });

    const totalClassificados = acima + media + abaixo;
    if (totalClassificados > 0) {
      this.classificacao.set({
        acima: Number(((acima / totalClassificados) * 100).toFixed(1)),
        media: Number(((media / totalClassificados) * 100).toFixed(1)),
        abaixo: Number(((abaixo / totalClassificados) * 100).toFixed(1))
      });
    } else {
      this.classificacao.set({ acima: 0, media: 0, abaixo: 0 });
    }
  }

  mudarFiltroClassificacao(filtro: string) {
    this.filtroClassificacao.set(filtro);
    this.calcularClassificacao();
  }

  alternarFiltro(filtro: string) {
    this.filtrosAtivos.set([filtro]);
  }
}