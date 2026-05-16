import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { DetalheTeste, TesteListagem } from '../../shared/interfaces/testes.interface';


@Injectable({
  providedIn: 'root'
})
export class TestesService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl; 

  buscarTesteUsuario(email: string = '', idTeste: number): Observable<DetalheTeste> {
    let params = new HttpParams();
    if (email) {
      params = params.set('email', email);
    }
    
    return this.http.get<DetalheTeste>(`${this.apiUrl}/users/tests/${idTeste}/result`, { params });
  }

  buscarListaTestesUsuario(id: number, email: string = ''): Observable<TesteListagem[]> {
    console.warn("Chamou o serviço de testes")
    let params = new HttpParams();
    if (email) {
      params = params.set('email', email);
    }
    
    return this.http.get<TesteListagem[]>(`${this.apiUrl}/users/tests`, { params });
  }


}