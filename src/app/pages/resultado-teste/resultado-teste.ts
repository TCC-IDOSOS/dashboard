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

  limiteRepeticaoCompleta = 0.7;

  abrir(dadosRecebidos: any) {
    this.dados.set(dadosRecebidos);
    this.exibir.set(true);
    document.body.style.overflow = 'hidden';
  }

  fechar() {
    this.exibir.set(false);
    document.body.style.overflow = 'auto';
  }

  calcularAlturaBarra(valor: number): string {
    const altura = Math.min(valor, 100); 
    return `${altura}%`;
  }

  imprimir() {
    window.print();
  }
}