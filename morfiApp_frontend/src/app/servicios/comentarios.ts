import { Service, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Comentario, PaginaComentarios } from '../models/comentario';

@Service()
export class ComentariosService {
  // HttpClient para hablar con el back
  private http = inject(HttpClient);

  // Armo la URL base de los comentarios
  private url(publicacionId: string) {
    return `${environment.apiUrl}/publicaciones/${publicacionId}/comentarios`;
  }

  // GET: una tanda de comentarios
  listar(publicacionId: string, offset: number, limit: number) {
    return this.http.get<PaginaComentarios>(this.url(publicacionId), { params: { offset, limit } });
  }

  // POST: agrega un comentario
  // el back toma el usuario del token
  crear(publicacionId: string, mensaje: string) {
    return this.http.post<Comentario>(this.url(publicacionId), { mensaje });
  }

  // PUT: cambia el mensaje de un comentario propio
  modificar(publicacionId: string, comentarioId: string, mensaje: string) {
    return this.http.put<Comentario>(`${this.url(publicacionId)}/${comentarioId}`, { mensaje });
  }
}