import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MenuLateral } from '../../components/menu-lateral/menu-lateral';
import { UsuariosService } from '../../services/usuarios/usuarios';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule, MenuLateral],
  templateUrl: './home.html'
})
export default class HomeComponent implements OnInit {

  totalPacientes = signal(0);
  testesNoPeriodo = signal(95);
  classificacao = signal({
    acima: 40,
    media: 35,
    abaixo: 25
  });

  totalPorTipo = signal([
    { label: '2MST', valor: 320, percent: 100 },
    { label: 'UTT', valor: 240, percent: 75 }
  ]);

  filtrosAtivos = signal(['Região']);
  distribuicao = signal([
    { label: 'Norte', valor: 320, percent: 100 },
    { label: 'Sul', valor: 260, percent: 81 },
    { label: 'Leste', valor: 190, percent: 59 },
    { label: 'Oeste', valor: 260, percent: 81 }
  ]);

  pontosGraficoLinha = signal('0,150 200,80 400,120 600,40 800,100 1000,20');

  usuarioService = inject(UsuariosService);

  ngOnInit(): void {
    this.usuarioService.listarPacientes().subscribe({
      next: (dadosRetornados) => {
        this.totalPacientes.set(dadosRetornados.length);
      },
      error: (erro) => {
        console.error("Falha ao buscar os usuários: ", erro);
      }
    });
  }
  

  alternarFiltro(filtro: string) {
    this.filtrosAtivos.set([filtro]);
  }
}