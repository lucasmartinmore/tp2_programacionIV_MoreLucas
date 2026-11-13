import { Service, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Usuario } from '../models/usuario';

@Service()
export class UsuariosService {
  private http = inject(HttpClient);
  private url = `${environment.apiUrl}/usuarios`;

  // PUT: modifica mi perfil 
  // (FormData porque puede llevar la foto)
  actualizarPerfil(datos: FormData) {
    return this.http.put<Usuario>(`${this.url}/perfil`, datos);
  }

  // GET: lista de usuarios (administrador)
  listar() {
    return this.http.get<Usuario[]>(this.url);
  }

  // POST: el administrador crea un usuario 
  crear(datos: FormData) {
    return this.http.post<Usuario>(this.url, datos);
  }

  // DELETE: deshabilita 
  // (devuelve el usuario ya actualizado)
  deshabilitar(id: string) {
    return this.http.delete<Usuario>(`${this.url}/${id}`);
  }

  // POST: rehabilita
  habilitar(id: string) {
    return this.http.post<Usuario>(`${this.url}/${id}/habilitar`, {});
  }

  // PUT: el administrador cambia el perfil de otro usuario (devuelve el usuario actualizado)
  cambiarPerfil(id: string, perfil: 'usuario' | 'administrador') {
    return this.http.put<Usuario>(`${this.url}/${id}/perfil`, { perfil });
  }
}