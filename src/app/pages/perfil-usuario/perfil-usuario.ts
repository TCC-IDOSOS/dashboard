import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MenuLateral } from '../../components/menu-lateral/menu-lateral';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MenuLateral],
  templateUrl: './perfil-usuario.html'
})
export default class ProfileComponent implements OnInit {
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);

  profileForm!: FormGroup;
  formErrorMessage = signal<string | null>(null);

  unidadesSaude = ['Unidade Central', 'Posto Norte', 'Clínica Sul', 'Hospital Leste'];

  ngOnInit(): void {
    this.buildForm();
    this.setupCepListener();
    this.carregarDadosUsuario();
  }

  buildForm(): void {
    this.profileForm = this.fb.group({
      nomeCompleto: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]], 
      dataNascimento: ['', [Validators.required, this.pastDateValidator]], 
      cpf: ['', [Validators.required, this.cpfValidator]], 
      cep: ['', Validators.required],
      rua: [{ value: '', disabled: true }], 
      numero: ['', Validators.required],
      bairro: ['', Validators.required],
      cidade: [{ value: '', disabled: true }], 
      uf: [{ value: '', disabled: true }], 
      unidadeSaude: ['', Validators.required],
      senha: ['', Validators.required]
    });
  }

  carregarDadosUsuario(): void {
    const dadosBanco = {
      nomeCompleto: 'Alan Silva',
      email: 'alan@exemplo.com',
      dataNascimento: '1990-05-15',
      cpf: '123.456.789-00',
      cep: '01001-000',
      rua: 'Praça da Sé',
      numero: '123',
      bairro: 'Sé',
      cidade: 'São Paulo',
      uf: 'SP',
      unidadeSaude: 'Unidade Central',
      senha: '' 
    };

    this.profileForm.patchValue(dadosBanco);
  }

  setupCepListener(): void {
    this.profileForm.get('cep')?.valueChanges.subscribe(cep => {
      if (!cep) return;
      const cleanCep = cep.replace(/\D/g, '');
      if (cleanCep.length === 8) {
        this.http.get<any>(`https://viacep.com.br/ws/${cleanCep}/json/`).subscribe(data => {
          if (!data.erro) {
            this.profileForm.patchValue({
              rua: data.logradouro,
              bairro: data.bairro,
              cidade: data.localidade,
              uf: data.uf
            });
          }
        });
      }
    });
  }

  salvarAlteracoes(): void {
    this.formErrorMessage.set(null);

    if (this.profileForm.invalid) {
      this.handleValidationErrors();
      return;
    }

    const formData = this.profileForm.getRawValue();
    console.log('Salvando no banco de dados...', formData);
    alert('Alterações salvas com sucesso!');
  }

  private handleValidationErrors(): void {
    const controls = this.profileForm.controls;
    
    const hasEmptyFields = Object.values(controls).some(c => c.errors?.['required']);
    if (hasEmptyFields) {
      this.formErrorMessage.set('Favor preencher todos os campos');
      return;
    }

    if (controls['email'].errors?.['email']) {
      this.formErrorMessage.set('E-mail inválido');
      return;
    }

    if (controls['dataNascimento'].errors?.['futureDate']) {
      this.formErrorMessage.set('Data de nascimento superior a data atual');
      return;
    }

    if (controls['cpf'].errors?.['invalidCpf']) {
      this.formErrorMessage.set('CPF inválido');
      return;
    }
  }

  pastDateValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;
    const inputDate = new Date(control.value);
    const today = new Date();
    return inputDate > today ? { futureDate: true } : null;
  }

  cpfValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;
    const cpfRegex = /^\d{3}\.\d{3}\.\d{3}\-\d{2}$|^\d{11}$/;
    return cpfRegex.test(control.value) ? null : { invalidCpf: true };
  }
}