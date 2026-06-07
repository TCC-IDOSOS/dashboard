import { Component, inject, input, output, OnInit } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { UnidadeSaude } from '../../shared/interfaces/unidade-saude.interface';
import { Operacao } from '../../shared/interfaces/operacao.enum';
import { zip } from 'rxjs';
import { UnidadeSaudeService } from '../../services/unidade-saude/unidade-saude-service';
import { form } from '@angular/forms/signals';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-unidade-saude-modal',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './unidade-saude-modal.html'
})
export class UnidadeSaudeModalComponent implements OnInit {
  
  private fb = inject(NonNullableFormBuilder);

  unidade = input<UnidadeSaude | null>(null);
  fechar = output<void>();
  unidadeSalva = output<void>();
  formErrorMessage: string | null = null;

  criarEditarUnidadeSaude = input<Operacao.CRIAR | Operacao.EDITAR>(Operacao.CRIAR)

  unidadeSaudeService = inject(UnidadeSaudeService)
  private http = inject(HttpClient);

  unidadeForm = this.fb.group({
    name: ['', Validators.required],
    streetName: ['', Validators.required],
    streetNumber: ['', Validators.required],
    zipCode: ['', Validators.required],
    bairro: ['', Validators.required],
    city: ['', Validators.required],
    state: ['', Validators.required],
    cnpj: ['', Validators.required],
    phone: [''],
    email: ['', [Validators.email]],
    complement: ['']
  });

  ngOnInit() {
    this.setupCepListener();
    const dadosEdicao = this.unidade();
    if (dadosEdicao) {
      this.unidadeForm.patchValue({
        name: dadosEdicao.name,
        cnpj: dadosEdicao.cnpj,
        zipCode: dadosEdicao.address?.zipCode,
        streetName: dadosEdicao.address?.streetName,
        streetNumber: dadosEdicao.address?.streetNumber,
        bairro: dadosEdicao.address?.bairro,
        city: dadosEdicao.address?.city,
        state: dadosEdicao.address?.state,
        phone: dadosEdicao.phone,
        email: dadosEdicao.email,
        complement: dadosEdicao.address?.complement
      });
    }
  }

  setupCepListener(): void {
    this.unidadeForm.get('zipCode')?.valueChanges.subscribe(cep => {
      if (!cep) return;
      const cleanCep = cep.replace(/\D/g, '');
      if (cleanCep.length === 8) {
        this.http.get<any>(`https://viacep.com.br/ws/${cleanCep}/json/`).subscribe(data => {
          if (!data.erro) {
            this.unidadeForm.patchValue({
              streetName: data.logradouro,
              bairro: data.bairro,
              city: data.localidade,
              state: data.uf
            });
          }
        });
      }
    });
  }

  salvar() {
    this.formErrorMessage = null;

    if (this.unidadeForm.valid) {
      const formData = this.unidadeForm.getRawValue();
      const isEdicao = !!this.unidade();

      const payload: UnidadeSaude = {
        id: isEdicao ? this.unidade()!.id : this.unidadeSaudeService.idUnidade,
        name: formData.name,
        cnpj: formData.cnpj,
        phone: formData.phone,
        email: formData.email,
        address: {
          streetName: formData.streetName,
          streetNumber: formData.streetNumber,
          zipCode: formData.zipCode,
          bairro: formData.bairro,
          city: formData.city,
          state: formData.state,
          complement: formData.complement
        },
      }

      if(!isEdicao) {
        this.unidadeSaudeService.criarUnidadeSaude(payload).subscribe({
          next: (res) => {
            alert('Unidade cadastrada com sucesso!');
            this.fechar.emit();
            this.unidadeSalva.emit();
          }
        })
      } else {
        this.unidadeSaudeService.atualizarUnidadeSaude(this.unidade()!.id, payload).subscribe({
          next: (res) => {
            alert('Unidade atualizada com sucesso!');
            this.fechar.emit();
            this.unidadeSalva.emit();
          }
        });
      }

    } else {
      this.unidadeForm.markAllAsTouched();
    }
  }

  aplicarMascaraCep(event: Event) {
    const input = event.target as HTMLInputElement;
    let valor = input.value.replace(/\D/g, ''); 

    if (valor.length > 8) {
      valor = valor.substring(0, 8);
    }

    if (valor.length > 5) {
      valor = valor.replace(/(\d{5})(\d{1,3})/, '$1-$2');
    }

    input.value = valor;
    this.unidadeForm.get('zipCode')?.setValue(valor, { emitEvent: false });
  }

  aplicarMascaraCnpj(event: Event) {
    const input = event.target as HTMLInputElement;
    let valor = input.value.replace(/\D/g, '');

    if (valor.length > 14) valor = valor.substring(0, 14);

    if (valor.length > 12) {
      valor = valor.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    } else if (valor.length > 8) {
      valor = valor.replace(/(\d{2})(\d{3})(\d{3})(\d{1,4})/, '$1.$2.$3/$4');
    } else if (valor.length > 5) {
      valor = valor.replace(/(\d{2})(\d{3})(\d{1,3})/, '$1.$2.$3');
    } else if (valor.length > 2) {
      valor = valor.replace(/(\d{2})(\d{1,3})/, '$1.$2');
    }

    input.value = valor;
    this.unidadeForm.get('cnpj')?.setValue(valor, { emitEvent: false });
  }

  aplicarMascaraTelefone(event: Event) {
    const input = event.target as HTMLInputElement;
    let valor = input.value.replace(/\D/g, '');

    if (valor.length > 11) valor = valor.substring(0, 11);
    
    valor = valor.replace(/^(\d{2})(\d)/g, '($1) $2');
    valor = valor.replace(/(\d)(\d{4})$/, '$1-$2');

    input.value = valor;
    this.unidadeForm.get('phone')?.setValue(valor, { emitEvent: false });
  }
}