import { Component, OnInit, inject, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-user-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './user-modal.html',
  styleUrls: ['./user-modal.css']
})
export class UserModalComponent implements OnInit {
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);

  fechar = output<void>();

  userForm!: FormGroup;
  formErrorMessage: string | null = null;
  
  // mocks para teste
  //TODO: REMOVER
  unidadesSaude = ['Unidade Central', 'Posto Norte', 'Clínica Sul', 'Hospital Leste'];
  tiposUsuario = ['Paciente', 'Profissional da Saúde'];

  ngOnInit(): void {
    this.buildForm();
    this.setupCepListener();
  }

  buildForm(): void {
    this.userForm = this.fb.group({
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
      quantidadeQuedas: [0, Validators.required],
      unidadeSaude: ['', Validators.required],
      tipoUsuario: ['', Validators.required],
      senha: ['', [Validators.required, this.passwordValidator]]
    });
  }

  setupCepListener(): void {
    this.userForm.get('cep')?.valueChanges.subscribe(cep => {
      const cleanCep = cep.replace(/\D/g, '');
      if (cleanCep.length === 8) {
        this.http.get<any>(`https://viacep.com.br/ws/${cleanCep}/json/`).subscribe(data => {
          if (!data.erro) {
            this.userForm.patchValue({
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

  salvar(): void {
    this.formErrorMessage = null;
    if (this.userForm.invalid) {
      this.handleValidationErrors();
      return;
    }

    const userData = this.userForm.getRawValue();
    console.log('Usuário salvo com sucesso!', userData);
    alert('Usuário cadastrado com sucesso!');
    
    this.fechar.emit();
  }

  cancelar(): void {
    this.fechar.emit(); 
  }

  private handleValidationErrors(): void {
    const controls = this.userForm.controls;
    
    const hasEmptyFields = Object.values(controls).some(c => c.errors?.['required']);
    if (hasEmptyFields) {
      this.formErrorMessage = 'Favor preencher todos os campos';
      return;
    }

    if (controls['email'].errors?.['email']) {
      this.formErrorMessage = 'E-mail inválido';
      return;
    }

    if (controls['dataNascimento'].errors?.['futureDate']) {
      this.formErrorMessage = 'Data de nascimento superior a data atual';
      return;
    }

    if (controls['cpf'].errors?.['invalidCpf']) {
      this.formErrorMessage = 'CPF inválido';
      return;
    }

    if (controls['senha'].errors?.['weakPassword']) {
      this.formErrorMessage = 'Favor preencher uma senha que contenha mínimo 8 dígitos, contendo ao menos 1 letra maiúscula, 1 letra minúscula e 1 número';
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

  passwordValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;
    const passRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d\W]{8,}$/;
    return passRegex.test(control.value) ? null : { weakPassword: true };
  }
}