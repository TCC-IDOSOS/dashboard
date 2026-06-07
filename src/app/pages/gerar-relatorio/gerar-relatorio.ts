import { Component, signal, inject, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MenuLateral } from '../../components/menu-lateral/menu-lateral';
import { UsuariosService } from '../../services/usuarios/usuarios';
import { TestesService } from '../../services/testes/testesService';
import { UnidadeSaudeService } from '../../services/unidade-saude/unidade-saude-service';
import { LoginService } from '../../services/login/login';
import { Router } from '@angular/router';
import { UnidadeSaude } from '../../shared/interfaces/unidade-saude.interface';

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
  private loginService = inject(LoginService);
  private router = inject(Router);

  dataInicial = signal('');
  dataFinal = signal('');
  nomeIdoso = signal('');
  unidadeSaude = signal('');
  regiao = signal('');
  idade = signal('');
  isLoading = signal(false);

  unidadesDisponiveis = signal<string[]>([]);
  unidadesList = signal<UnidadeSaude[]>([]);

  pacientes = signal<any[]>([]);
  mostrarDropdown = signal(false);

  pacientesFiltrados = computed(() => {
    const termo = this.nomeIdoso().toLowerCase();
    if (!termo || !this.mostrarDropdown()) return [];
    return this.pacientes().filter(p => p.name.toLowerCase().includes(termo));
  });

  ngOnInit(): void {
    const idUsuario = this.loginService.getIdUsuarioLogado();
    if (idUsuario) {
      this.usuarioService.buscarUsuarioPorId(idUsuario).subscribe({
        next: (dados) => {
          if (dados.profile !== 'Profissional') {
            this.router.navigate(['/testes']);
            return;
          }
        }
      });
    }

    this.unidadeSaudeService.listarUnidadesSaude().subscribe({
      next: (unidades) => {
        this.unidadesList.set(unidades);
        this.unidadesDisponiveis.set(unidades.map(u => u.name));
      },
      error: (err) => {
        console.error("Erro ao carregar unidades de saúde", err);
        this.unidadesList.set([]);
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

    const unidadeSelecionada = this.unidadesList().find(u => u.name === this.unidadeSaude());

    this.testesService.gerarRelatorioResultados({
      startDate: this.dataInicial(),
      endDate: this.dataFinal(),
      patientName: this.nomeIdoso() || undefined,
      healthUnitId: unidadeSelecionada?.id,
      patientAge: this.idade() ? Number(this.idade()) : undefined
    }).subscribe({
      next: (pdf) => {
        this.baixarPdf(pdf);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Erro ao gerar relatório:', err);
        alert('Ocorreu um erro ao gerar o relatório.');
        this.isLoading.set(false);
      }
    });
  }

  private baixarPdf(pdf: Blob) {
    const url = URL.createObjectURL(pdf);
    const link = document.createElement('a');
    link.href = url;
    link.download = `relatorio_${this.dataInicial()}_${this.dataFinal()}.pdf`;
    link.click();
    URL.revokeObjectURL(url);
  }
}