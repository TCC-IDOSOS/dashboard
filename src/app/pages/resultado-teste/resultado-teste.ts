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
  maiorValor = signal<number>(100);
  dataHoje = new Date();

  abrir(dadosRecebidos: any) {
    this.dados.set(dadosRecebidos);

    const amplitudes = (dadosRecebidos?.cycles || []).map((c: any) => c.amplitude_cm || c || 0);
    this.maiorValor.set(Math.max(...amplitudes, 1));

    this.maxRef.set(100); 

    this.exibir.set(true);
    document.body.style.overflow = 'hidden';
  }

  fechar() {
    this.exibir.set(false);
    document.body.style.overflow = 'auto';
  }

  calcularAlturaBarra(valor: number): string {
    const max = this.maiorValor();
    const altura = Math.min((valor / max) * 100, 100); 
    return `${altura}%`;
  }

  imprimir() {
    window.print();
  }
}