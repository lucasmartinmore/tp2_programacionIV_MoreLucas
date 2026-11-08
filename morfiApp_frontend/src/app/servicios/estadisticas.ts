import { Service, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Service()
export class EstadisticasService {
  private http = inject(HttpClient);
  private url = `${environment.apiUrl}/estadisticas`;

  // publicaciones (desde y hasta, AAAA-MM-DD)
  publicacionesPorUsuario(desde: string, hasta: string) {
    return this.http.get<{ usuario: string; cantidad: number }[]>(`${this.url}/publicaciones-por-usuario`, { params: { desde, hasta } });
  }

  comentariosPorDia(desde: string, hasta: string) {
    return this.http.get<{ fecha: string; cantidad: number }[]>(`${this.url}/comentarios-por-dia`, { params: { desde, hasta } });
  }

  comentariosPorPublicacion(desde: string, hasta: string) {
    return this.http.get<{ publicacion: string; cantidad: number }[]>(`${this.url}/comentarios-por-publicacion`, { params: { desde, hasta } });
  }
}