import { Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ILogin } from '../../shared/interfaces/login.interface';
import { LoginService } from '../../services/login/login';
import { Router } from '@angular/router';


@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './login.html'
})
export default class Login {
  private fb = inject(NonNullableFormBuilder);
  private loginService = inject(LoginService)
  private router = inject(Router);

  isLoading = signal(false);
  errorMessage = signal<string | null>(null);

  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  onSubmit() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const login: ILogin = {
      email: this.loginForm.getRawValue().email,
      password: this.loginForm.getRawValue().password
    }

    this.loginService.login(login).subscribe({
      next: (res) => {
        this.loginService.salvarToken(res.token);
        this.loginService.setIdUsuarioLogado(Number(res.userId));
        this.router.navigate(['/home']);
      },
      error: (err) => {
        this.isLoading.set(false);
        if (err.status === 401) {
          this.errorMessage.set('E-mail ou senha inválidos');
        } else {
          this.errorMessage.set('Ocorreu um erro ao fazer login. Tente novamente.');
        }
      }
    })
  }
}