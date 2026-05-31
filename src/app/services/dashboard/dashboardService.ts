import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { Observable } from 'rxjs';
import { DashboardStats } from '../../shared/interfaces/dashboard.interface';

@Injectable({
  providedIn: 'root',
})
export class DashboardService {

  private http = inject(HttpClient);
  
  private apiUrl = environment.apiUrl; 

  obterEstatisticas(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(`${this.apiUrl}/dashboard/stats`);
  }

}
