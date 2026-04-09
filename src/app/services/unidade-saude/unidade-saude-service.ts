import { inject, Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UnidadeSaude } from '../../shared/interfaces/unidade-saude.interface';

@Injectable({
  providedIn: 'root',
})
export class UnidadeSaudeService {

  private http = inject(HttpClient);
  
  private apiUrl = environment.apiUrl; 

  static ID_UNIDADE_SAUDE: number = 1

  listarUnidadesSaude(): Observable<UnidadeSaude[]> {
    return this.http.get<UnidadeSaude[]>(`${this.apiUrl}/health-unit`);
  }

  obterUnidadeSaude(id: number | string): Observable<UnidadeSaude> {
    return this.http.get<UnidadeSaude>(`${this.apiUrl}/health-unit/${id}`);
  }

  criarUnidadeSaude(unidade: UnidadeSaude): Observable<UnidadeSaude> {
    UnidadeSaudeService.ID_UNIDADE_SAUDE += 1;
    return this.http.post<UnidadeSaude>(`${this.apiUrl}/health-unit`, unidade);
  }

  atualizarUnidadeSaude(id: number, unidade: UnidadeSaude): Observable<UnidadeSaude> {
    return this.http.put<UnidadeSaude>(`${this.apiUrl}/health-unit/${id}`, unidade);
  }

  excluirUnidadeSaude(id: number | string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/health-unit/${id}`);
  }

    get idUnidade(): number {
      return UnidadeSaudeService.ID_UNIDADE_SAUDE;
    }
}