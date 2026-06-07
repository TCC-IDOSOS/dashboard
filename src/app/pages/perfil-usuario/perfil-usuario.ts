import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MenuLateral } from '../../components/menu-lateral/menu-lateral';
import { LoginService } from '../../services/login/login';
import { Router } from '@angular/router';
import { UsuariosService } from '../../services/usuarios/usuarios';
import { UnidadeSaudeService } from '../../services/unidade-saude/unidade-saude-service';
import { Usuario } from '../../shared/interfaces/usuario.interface';
import { disabled } from '@angular/forms/signals';

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
  private unidadeSaudeService = inject(UnidadeSaudeService)

  profileForm!: FormGroup;
  formErrorMessage = signal<string | null>(null);

  unidadesSaude: string[]= [];
  unidadesSaudeList: any[] = [];

  idUsuario: number | null = null;
  usuarioLogado: Usuario = {} as Usuario;

  ngOnInit(): void {
    this.buildForm();
    this.setupCepListener();

    this.unidadeSaudeService.listarUnidadesSaude().subscribe({
      next: (dadosRetornados) => {
        this.unidadesSaudeList = dadosRetornados;
        dadosRetornados.forEach(unidade => this.unidadesSaude.push(unidade.name))
        
      },
      error: (erro) => {
        console.error("Falha ao buscar as unidades de saúde: ", erro);
      }
    })

    this.idUsuario = this.loginService.getIdUsuarioLogado();
    
    if (this.idUsuario) {
      this.usuariosService.buscarUsuarioPorId(this.idUsuario).subscribe({
        next: (user) => {
          this.usuarioLogado = user;
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
            phone: user.phone,
            unidadeSaude: user.healthUnit.name,
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
      birthDate: [{ value: '', disabled: true }], 
      cpf: ['', [Validators.required, this.cpfValidator]], 
      zipCode: ['', Validators.required],
      streetName: [{ value: '', disabled: true }], 
      streetNumber: ['', Validators.required],
      bairro: ['', Validators.required],
      city: [{ value: '', disabled: true }], 
      state: [{ value: '', disabled: true }], 
      phone: ['', Validators.required],
      unidadeSaude: ['', Validators.required],
      password: ['', [this.passwordValidator]]
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

    const userData = this.profileForm.getRawValue();
    const selectedUnit = this.unidadesSaudeList.find(u => u.name === userData.unidadeSaude);

    const payload: any = {
      name: userData.name,
      email: userData.email,
      birthDate: this.usuarioLogado.birthDate,
      cpf: this.usuarioLogado.cpf,
      address: {
        zipCode: userData.zipCode,
        streetName: userData.streetName,
        streetNumber: userData.streetNumber,
        bairro: userData.bairro,
        city: userData.city,
        state: userData.state,
        complement: userData.complement
      },
      id: this.idUsuario,
      genre: this.usuarioLogado.genre,
      profile: this.usuarioLogado.profile,
      phone: userData.phone,
      ativo: "sim",
      password: userData.password,
      healthUnit: selectedUnit ? {
        name: selectedUnit.name,
        cnpj: selectedUnit.cnpj,
        phone: selectedUnit.phone || "",
        email: selectedUnit.email || "",
        address: {
          streetName: selectedUnit.address?.streetName || "",
          streetNumber: selectedUnit.address?.streetNumber || "",
          complement: selectedUnit.address?.complement || "",
          city: selectedUnit.address?.city || "",
          state: selectedUnit.address?.state || "",
          zipCode: selectedUnit.address?.zipCode || "",
          neighborhood: selectedUnit.address?.bairro || selectedUnit.address?.neighborhood || ""
        }
      } : null
    };

        this.usuariosService.atualizarUsuario(this.idUsuario!, payload).subscribe({
        next: (res) => {
          alert('Alterações salvas com sucesso!');
        }
      })
  }

  logout(): void {
    this.loginService.removerToken();
    sessionStorage.removeItem('ID_USUARIO');
    sessionStorage.removeItem('USER_PROFILE');
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

    if (controls['password'].errors?.['invalidPassword']) {
      this.formErrorMessage.set('Confirme sua senha ou insira uma senha nova');
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

  aplicarMascaraCpf(event: Event) {
    const input = event.target as HTMLInputElement;
    let valor = input.value.replace(/\D/g, ''); 

    if (valor.length > 11) valor = valor.substring(0, 11);

    if (valor.length > 9) {
      valor = valor.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    } else if (valor.length > 6) {
      valor = valor.replace(/(\d{3})(\d{3})(\d{1,3})/, '$1.$2.$3');
    } else if (valor.length > 3) {
      valor = valor.replace(/(\d{3})(\d{1,3})/, '$1.$2');
    }

    input.value = valor;
    this.profileForm.get('cpf')?.setValue(valor, { emitEvent: false });
  }

  aplicarMascaraCep(event: Event) {
    const input = event.target as HTMLInputElement;
    let valor = input.value.replace(/\D/g, ''); 

    if (valor.length > 8) valor = valor.substring(0, 8);
    if (valor.length > 5) valor = valor.replace(/(\d{5})(\d{1,3})/, '$1-$2');

    input.value = valor;
    this.profileForm.get('zipCode')?.setValue(valor, { emitEvent: false });
  }

  aplicarMascaraTelefone(event: Event) {
    const input = event.target as HTMLInputElement;
    let valor = input.value.replace(/\D/g, '');

    if (valor.length > 11) valor = valor.substring(0, 11);
    valor = valor.replace(/^(\d{2})(\d)/g, '($1) $2').replace(/(\d)(\d{4})$/, '$1-$2');

    input.value = valor;
    this.profileForm.get('phone')?.setValue(valor, { emitEvent: false });
  }
}