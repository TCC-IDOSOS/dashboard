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
    let params = new HttpParams();
    if (email) {
      params = params.set('email', email);
    }

    return this.http.get<TesteListagem[]>(`${this.apiUrl}/users/tests`, { params });
  }

  gerarRelatorioResultados(filtros: {
    startDate: string;
    endDate: string;
    patientName?: string;
    healthUnitId?: number;
    patientAge?: number;
  }): Observable<Blob> {
    let params = new HttpParams()
      .set('startDate', filtros.startDate)
      .set('endDate', filtros.endDate);

    if (filtros.patientName) {
      params = params.set('patientName', filtros.patientName);
    }
    if (filtros.healthUnitId != null) {
      params = params.set('healthUnitId', String(filtros.healthUnitId));
    }
    if (filtros.patientAge != null) {
      params = params.set('patientAge', String(filtros.patientAge));
    }

    return this.http.get(`${this.apiUrl}/reports/test-results`, {
      params,
      responseType: 'blob'
    });
  }

}