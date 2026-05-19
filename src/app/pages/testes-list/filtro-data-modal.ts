import { Component, EventEmitter, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-filtro-data-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './filtro-data-modal.html'
})
export class FiltroDataModalComponent {
  dataInicio = signal<string>('');
  dataFim = signal<string>('');

  @Output() fechar = new EventEmitter<void>();
  @Output() aplicar = new EventEmitter<{ inicio: string, fim: string }>();

  aplicarFiltro() {
    this.aplicar.emit({
      inicio: this.dataInicio(),
      fim: this.dataFim()
    });
  }

  limpar() {
    this.dataInicio.set('');
    this.dataFim.set('');
    this.aplicarFiltro();
  }
}