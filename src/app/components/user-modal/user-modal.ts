import { Component, OnInit, inject, output, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Genero, PerfilUsuario, Usuario } from '../../shared/interfaces/usuario.interface';
import { UsuariosService } from '../../services/usuarios/usuarios';
import { Operacao } from '../../shared/interfaces/operacao.enum';
import { ThisReceiver } from '@angular/compiler';
import { UnidadeSaudeService } from '../../services/unidade-saude/unidade-saude-service';
import { disabled } from '@angular/forms/signals';

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
  private userService = inject(UsuariosService)
  private unidadeSaudeService = inject(UnidadeSaudeService)

  fechar = output<void>();
  usuario = input<Usuario | null>(null);
  criarEditarUsuario = input<Operacao.CRIAR | Operacao.EDITAR>(Operacao.CRIAR)
  isEditing = false;


  userForm!: FormGroup;
  formErrorMessage: string | null = null;
  
  unidadesSaude: string[]= [];
  tiposUsuario = ['Paciente', 'Profissional', "Admin"];
  genres = [Genero.MASCULINO, Genero.FEMININO, Genero.PREFIRO_NAO_INFORMAR, Genero.OUTRO]
  usuarioSalvo = output<void>();

  ngOnInit(): void {
    const user = this.usuario(); 

    this.unidadeSaudeService.listarUnidadesSaude().subscribe({
      next: (dadosRetornados) => {
        console.log(dadosRetornados)

        dadosRetornados.forEach(unidade => this.unidadesSaude.push(unidade.name))
        
      },
      error: (erro) => {
        console.error("Falha ao buscar as unidades de saúde: ", erro);
      }
    })

    this.isEditing = !!this.usuario();

    console.warn(this.criarEditarUsuario() === Operacao.EDITAR,  !!this.usuario(), "aaaaaa")



    this.buildForm();
    this.setupCepListener();
    if (user) {
      this.userForm.patchValue({
        name: user.name,
        email: user.email,
        birthDate: user.birthDate.toString().split('T')[0],
        cpf: user.cpf,
        zipCode: user.address.zipCode,
        streetName: user.address.streetName,
        streetNumber: user.address.streetNumber,
        bairro: user.address.bairro,
        city: user.address.city,
        state: user.address.state,
        complement: user.address.complement,
        id: '',
        genre: user.genre,
        profile: user.profile,
        telefone: user.telefone,
        ativo: "sim",
        password: user.password,
        unidadeSaude: user.unidadeSaude
      });
      this.userForm.get('cpf')?.disable();
    }
  }

  buildForm(): void {
    this.userForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      birthDate: ['', [Validators.required, this.pastDateValidator]],
      cpf: ['', [Validators.required, this.cpfValidator]],
      zipCode: ['', Validators.required],
      streetName: [{ value: '', disabled: true }],
      streetNumber: ['', Validators.required],
      bairro: ['', Validators.required],
      complement: [''],
      city: [{ value: '', disabled: true }],
      state: [{ value: '', disabled: true }],
      quantidadeQuedas: [0, Validators.required],
      unidadeSaude: ['', Validators.required],
      genre: ['', Validators.required],
      profile: ['', Validators.required],
      password: ['', [Validators.required, this.passwordValidator]]
    });
  }

  setupCepListener(): void {
    this.userForm.get('zipCode')?.valueChanges.subscribe(cep => {
      const cleanCep = cep.replace(/\D/g, '');
      if (cleanCep.length === 8) {
        this.http.get<any>(`https://viacep.com.br/ws/${cleanCep}/json/`).subscribe(data => {
          if (!data.erro) {
            this.userForm.patchValue({
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

  salvar(): void {
    this.formErrorMessage = null;
    if (this.userForm.invalid) {
      this.handleValidationErrors();
      return;
    }

    const userData = this.userForm.getRawValue();

    const payload: Usuario = {
      name: userData.name,
      email: userData.email,
      birthDate: userData.birthDate,
      cpf: userData.cpf,
      address: {
        zipCode: userData.zipCode,
        streetName: userData.streetName,
        streetNumber: userData.streetNumber,
        bairro: userData.bairro,
        city: userData.city,
        state: userData.state,
        complement: userData.complement
      },
      id: this.criarEditarUsuario() ===  Operacao.EDITAR ? userData.id : this.userService.idUsuario,
      genre: userData.genre,
      profile: userData.profile,
      telefone: userData.telefone,
      ativo: "sim",
      password: userData.password,
      unidadeSaude: userData.unidadeSaude
    }

    if(this.criarEditarUsuario() === Operacao.CRIAR) {
      this.userService.cadastrarUsuario(payload).subscribe({
        next: (res) => {
          alert('Usuário cadastrado com sucesso!');
          this.fechar.emit();
          this.usuarioSalvo.emit();
        }
      })
    } else {
      this.userService.atualizarUsuario(this.usuario()!.id, payload).subscribe({
        next: (res) => {
          alert('Usuario editado com sucesso!');
          this.fechar.emit();
          this.usuarioSalvo.emit();
        }
      })
    }
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

    if (controls['birthDate'].errors?.['futureDate']) {
      this.formErrorMessage = 'Data de nascimento superior a data atual';
      return;
    }

    if (controls['cpf'].errors?.['invalidCpf']) {
      this.formErrorMessage = 'CPF inválido';
      return;
    }

    if (controls['password'].errors?.['weakPassword']) {
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