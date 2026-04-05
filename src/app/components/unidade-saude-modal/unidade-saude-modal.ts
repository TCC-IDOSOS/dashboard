import { Component, inject, input, output, OnInit } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { UnidadeSaude } from '../../shared/interfaces/unidade-saude.interface';

@Component({
  selector: 'app-unidade-saude-modal',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './unidade-saude-modal.html'
})
export class UnidadeSaudeModalComponent implements OnInit {
  
  private fb = inject(NonNullableFormBuilder);

  // Entradas e Saídas do componente
  unidade = input<UnidadeSaude | null>(null);
  fechar = output<void>();
  unidadeSalva = output<void>();

  unidadeForm = this.fb.group({
    nome: ['', Validators.required],
    rua: ['', Validators.required],
    numero: ['', Validators.required],
    cep: ['', Validators.required],
    bairro: ['', Validators.required],
    cidade: ['', Validators.required],
    uf: ['', Validators.required],
    cnpj: ['', Validators.required]
  });

  ngOnInit() {
    const dadosEdicao = this.unidade();
    if (dadosEdicao) {
      this.unidadeForm.patchValue(dadosEdicao);
    }
  }

  salvar() {
    if (this.unidadeForm.valid) {
      const payload = this.unidadeForm.getRawValue();
      const isEdicao = !!this.unidade();

      console.log('Dados do Form:', payload);
      console.log('Modo de operação:', isEdicao ? 'PUT' : 'POST');

      this.unidadeSalva.emit();
    } else {
      this.unidadeForm.markAllAsTouched();
    }
  }
}