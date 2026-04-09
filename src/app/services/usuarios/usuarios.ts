import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Paciente, PerfilUsuario, Usuario } from '../../shared/interfaces/usuario.interface';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class UsuariosService {

  private http = inject(HttpClient);
  
  private apiUrl = environment.apiUrl; 

  static ID_USUARIO: number = 2

  listarPacientes(): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(`${this.apiUrl}/users/all`);
  }

  buscarUsuarioPorId(id: number): Observable<Usuario> {
    return this.http.get<Usuario>(`${this.apiUrl}/users/${id}`);
  }

  cadastrarUsuario(usuario: Usuario): Observable<Usuario> {
    UsuariosService.ID_USUARIO += 1;
    return this.http.post<Usuario>(`${this.apiUrl}/users`, usuario);
  }

  atualizarUsuario(id: number, usuario: Usuario): Observable<Usuario> {
    return this.http.put<Usuario>(`${this.apiUrl}/users/${id}`, usuario);
  }

  get idUsuario(): number {
    return UsuariosService.ID_USUARIO;
  }

  dadosUsuarioLogado(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/users/me`);
  }

}