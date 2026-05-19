import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MenuLateral } from '../../components/menu-lateral/menu-lateral';
import { LoginService } from '../../services/login/login';
import { Router } from '@angular/router';
import { UsuariosService } from '../../services/usuarios/usuarios';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MenuLateral],
  templateUrl: './perfil-usuario.html'
})
export default class ProfileComponent implements OnInit {
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private loginService = inject(LoginService);
  private router = inject(Router);
  private usuariosService = inject(UsuariosService);

  profileForm!: FormGroup;
  formErrorMessage = signal<string | null>(null);

  unidadesSaude = ['Unidade Central', 'Posto Norte', 'Clínica Sul', 'Hospital Leste'];

  ngOnInit(): void {
    this.buildForm();
    this.setupCepListener();

    const idUsuario = this.loginService.getIdUsuarioLogado();
    
    if (idUsuario) {
      this.usuariosService.buscarUsuarioPorId(idUsuario).subscribe({
        next: (user) => {
          this.profileForm.patchValue({
            name: user.name,
            email: user.email,
            birthDate: user.birthDate ? user.birthDate.toString().split('T')[0] : '',
            cpf: user.cpf,
            zipCode: user.address?.zipCode,
            streetName: user.address?.streetName,
            streetNumber: user.address?.streetNumber,
            bairro: user.address?.bairro,
            city: user.address?.city,
            state: user.address?.state,
            unidadeSaude: user.healthUnit.name || '',
            password: user.password
          });
        },
        error: (erro) => console.error('Erro ao buscar informações do usuário logado', erro)
      });
    }
  }

  buildForm(): void {
    this.profileForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]], 
      birthDate: ['', [Validators.required, this.pastDateValidator]], 
      cpf: ['', [Validators.required, this.cpfValidator]], 
      zipCode: ['', Validators.required],
      streetName: [{ value: '', disabled: true }], 
      streetNumber: ['', Validators.required],
      bairro: ['', Validators.required],
      city: [{ value: '', disabled: true }], 
      state: [{ value: '', disabled: true }], 
      unidadeSaude: ['', Validators.required],
      password: ['', Validators.required]
    });
  }

  setupCepListener(): void {
    this.profileForm.get('zipCode')?.valueChanges.subscribe(cep => {
      if (!cep) return;
      const cleanCep = cep.replace(/\D/g, '');
      if (cleanCep.length === 8) {
        this.http.get<any>(`https://viacep.com.br/ws/${cleanCep}/json/`).subscribe(data => {
          if (!data.erro) {
            this.profileForm.patchValue({
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

  salvarAlteracoes(): void {
    this.formErrorMessage.set(null);

    if (this.profileForm.invalid) {
      this.handleValidationErrors();
      return;
    }

    const formData = this.profileForm.getRawValue();
    alert('Alterações salvas com sucesso!');
  }

  logout(): void {
    this.loginService.removerToken();
    sessionStorage.removeItem('ID_USUARIO');
    this.router.navigate(['/login']);
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

    if (controls['birthDate'].errors?.['futureDate']) {
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