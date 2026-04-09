import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { Autenticacao, ILogin } from '../../shared/interfaces/login.interface';
import { Usuario } from '../../shared/interfaces/usuario.interface';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class LoginService {

  private http = inject(HttpClient);
  
  private apiUrl = environment.apiUrl; 
  private readonly TOKEN_KEY = 'TOKEN'; 
  private readonly ID_USUARIO = 'ID_USUARIO';

  

  login(login: ILogin): Observable<Autenticacao> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
    });
    return this.http.post<Autenticacao>(`${this.apiUrl}/auth/login`, login, {headers});
  }

  salvarToken(token: string): void {
    sessionStorage.setItem(this.TOKEN_KEY, token);
  }

  obterToken(): string | null {
    return sessionStorage.getItem(this.TOKEN_KEY);
  }

  removerToken(): void {
    sessionStorage.removeItem(this.TOKEN_KEY);
  }

  setIdUsuarioLogado(id: number): void {
    sessionStorage.setItem(this.ID_USUARIO, id.toString());
  }

  getIdUsuarioLogado(): number  | null {
    const id = sessionStorage.getItem(this.ID_USUARIO);
    return id ? Number(id) : null;
  }
  
}
