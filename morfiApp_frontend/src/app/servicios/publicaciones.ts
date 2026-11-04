/**
 * Es el servicio que habla con el back sobre publicaciones
 * Concentra todas las peticiones HTTP, asi los componentes no conocen las URLs
 * porque uso @Service() e inject()? En Angular 22 los servicios se declaran con @Service() y reciben sus
 * dependencias con inject() (el constructor ya no se usa para eso en servicios)
 * HttpParams Arma los parametros de la URL (?orden=fecha&offset=0) de forma segura
 * devuelvo observables para que quien lo use decida cuando hacer subscribe
 */

import { Service, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Orden, PaginaPublicaciones, Publicacion, ResumenMeGusta } from '../models/publicacion';// Los tipos de datos que definimos.

@Service()
export class PublicacionesService {
  private http = inject(HttpClient);// Pedimos HttpClient con inject().
  private url = `${environment.apiUrl}/publicaciones`;// La direccion base de todas las rutas de publicaciones

  // GET /publicaciones: trae una pag de publicaciones
  listar(opciones: { orden: Orden; offset: number; limit: number; usuarioId?: string }) {
    // Armamos los param de la URL(set devuelve un HttpParams nuevo)
    let params = new HttpParams().set('orden', opciones.orden).set('offset', opciones.offset).set('limit', opciones.limit);
    // El filtro por usuario opcional: solo lo agrego si vino
    if (opciones.usuarioId) params = params.set('usuarioId', opciones.usuarioId);
    // Hago el GET
    // <PaginaPublicaciones> le dice a TypeScript que forma tiene la respuesta
    return this.http.get<PaginaPublicaciones>(this.url, { params });
  }

  // POST /publicaciones: crea una publicacion
  // Recibe un FormData porque puede llevar una imagen
  crear(datos: FormData) {
    return this.http.post<Publicacion>(this.url, datos);
  }

  // GET: Trae una publi por id (pagde detalle)
  obtener(id: string) {
    return this.http.get<Publicacion>(`${this.url}/${id}`);
  }

  // DELETE /publicaciones/:id?usuarioId: baja logica
  // el back lo saca del token (el interceptor lo agrega)
  eliminar(id: string) {
    return this.http.delete<void>(`${this.url}/${id}`);
  }

  // POST /publicaciones/:id/me-gusta: dar me gusta
  darMeGusta(id: string) {
    return this.http.post<ResumenMeGusta>(`${this.url}/${id}/me-gusta`, {});
  }

  // DELETE /publicaciones/:id/me-gusta?usuarioId: quitar me gusta
  quitarMeGusta(id: string) {
    return this.http.delete<ResumenMeGusta>(`${this.url}/${id}/me-gusta`);
  }
}