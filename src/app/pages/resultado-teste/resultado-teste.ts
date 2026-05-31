import { Component, signal } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';

@Component({
  selector: 'app-resultado-teste',
  standalone: true,
  imports: [CommonModule],
  providers: [DecimalPipe],
  templateUrl: './resultado-teste.html'
})
export class ResultadoTesteComponent {
  exibir = signal(false);
  dados = signal<any>(null);
  maxRef = signal<number>(100);

  limiteRepeticaoCompleta = 0.7;

  abrir(dadosRecebidos: any) {
    this.dados.set(dadosRecebidos);
    
    if (dadosRecebidos?.testType === 'MARCHA') {
      const amplitudes = (dadosRecebidos.cycles || []).map((c: any) => c.amplitude_cm || c || 0);
      const max = Math.max(...amplitudes, 1);
      this.maxRef.set(max * 1.2); 
    } else {
      this.maxRef.set(100); 
    }

    this.exibir.set(true);
    document.body.style.overflow = 'hidden';
  }

  fechar() {
    this.exibir.set(false);
    document.body.style.overflow = 'auto';
  }

  calcularAlturaBarra(valor: number): string {
    const max = this.maxRef();
    const altura = Math.min((valor / max) * 100, 100); 
    return `${altura}%`;
  }

  imprimir() {
    window.print();
  }
}