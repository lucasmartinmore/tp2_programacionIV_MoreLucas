import { AfterViewInit, Component, ElementRef, OnDestroy, inject, signal, viewChild } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
// Chart = la clase que dibuja; 
// registerables = todos los tipos de grafico (barras, lineas, torta...)
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { EstadisticasService } from '../../servicios/estadisticas';
import { ModalService } from '../../servicios/modal';
import { mensajesDeError, tituloDeError } from '../../utils/errores';

// registro los tipos de grafico que vamos a usar
Chart.register(...registerables);

// Colores de la torta 
const PALETA = ['#e07b39', '#2f6b4f', '#d9a441', '#8c5a3c', '#6aa37f', '#c4553a', '#b8a58c', '#3f8f6b', '#f0b27a', '#7a5c3e'];

@Component({
  selector: 'app-dashboard-estadisticas',
  styleUrl: './dashboard-estadisticas.css',
  templateUrl: './dashboard-estadisticas.html',
})
export class DashboardEstadisticas implements AfterViewInit, OnDestroy {
  private service = inject(EstadisticasService);
  private modal = inject(ModalService);

  // Lapso elegido 
  // (por defecto, los ultimos 30 dias)
  desde = signal(this.fechaHace(30));
  hasta = signal(this.hoy());
  totalComentarios = signal(0);// (suma de los dias)

  // Referencias a los tres <canvas> del HTML 
  // donde se va a dibujar cada grafico
  private lienzoUsuarios = viewChild.required<ElementRef<HTMLCanvasElement>>('lienzoUsuarios');
  private lienzoDias = viewChild.required<ElementRef<HTMLCanvasElement>>('lienzoDias');
  private lienzoPublicaciones = viewChild.required<ElementRef<HTMLCanvasElement>>('lienzoPublicaciones');

  // Graficos ya dibujados 
  private graficos: Record<string, Chart | undefined> = {};

  // Cuando el HTML ya existe 
  // (los canvas estan disponibles)
  // dibujo
  ngAfterViewInit() {
    this.actualizar();
  }

  // al salir libero los graficos
  ngOnDestroy() {
    Object.values(this.graficos).forEach((g) => g?.destroy());
  }

  // Pide los tres conjuntos de datos
  //  con el lapso actual y redibuja
  actualizar() {
    const desde = this.desde();
    const hasta = this.hasta();

    // 1) Barras: publicaciones por usuario
    this.service.publicacionesPorUsuario(desde, hasta).subscribe({
      next: (datos) =>
        this.dibujar('usuarios', this.lienzoUsuarios(), {
          type: 'bar',
          data: {
            labels: datos.map((d) => `@${d.usuario}`),
            datasets: [{ label: 'Publicaciones', data: datos.map((d) => d.cantidad), backgroundColor: '#e07b39' }],
          },
          options: { responsive: true, scales: { y: { beginAtZero: true, ticks: { precision: 0 } } } },
        }),
      error: (err: HttpErrorResponse) => this.fallo(err),
    });

    // 2) Lineas: comentarios por dia
    this.service.comentariosPorDia(desde, hasta).subscribe({
      next: (datos) => {
        this.totalComentarios.set(datos.reduce((suma, d) => suma + d.cantidad, 0));
        this.dibujar('dias', this.lienzoDias(), {
          type: 'line',
          data: {
            labels: datos.map((d) => d.fecha),
            datasets: [{ label: 'Comentarios', data: datos.map((d) => d.cantidad), borderColor: '#2f6b4f', tension: 0.3 }],
          },
          options: { responsive: true, scales: { y: { beginAtZero: true, ticks: { precision: 0 } } } },
        });
      },
      error: (err: HttpErrorResponse) => this.fallo(err),
    });

    // 3) Torta: comentarios por publi
    this.service.comentariosPorPublicacion(desde, hasta).subscribe({
      next: (datos) =>
        this.dibujar('publicaciones', this.lienzoPublicaciones(), {
          type: 'doughnut',
          data: {
            labels: datos.map((d) => d.publicacion),
            datasets: [{ data: datos.map((d) => d.cantidad), backgroundColor: PALETA }],
          },
          options: { responsive: true },
        }),
      error: (err: HttpErrorResponse) => this.fallo(err),
    });
  }

  // Dibuja un gráfico, si ya habia uno 
  // lo destruye primero (si no, Chart.js da error)
  private dibujar(clave: string, lienzo: ElementRef<HTMLCanvasElement>, config: ChartConfiguration) {
    this.graficos[clave]?.destroy();
    this.graficos[clave] = new Chart(lienzo.nativeElement, config);
  }

  private fallo(err: HttpErrorResponse) {
    this.modal.mostrar('error', tituloDeError(err.status), mensajesDeError(err));
  }

  // Fecha de hoy como "AAAA-MM-DD"
  private hoy() {
    return new Date().toISOString().slice(0, 10);
  }

  // Fecha de hace N dias como "AAAA-MM-DD"
  private fechaHace(dias: number) {
    return new Date(Date.now() - dias * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  }
}