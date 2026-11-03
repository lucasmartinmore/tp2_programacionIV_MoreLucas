/**
 * Pantalla con los datos del usuario logueado y sus ultimas 3 publis
 * - de donde salen las 3 publicaciones? Del mismo GET /publicaciones del listado, con el filtro usuarioId y limit=3
 * No hace falta una ruta nueva: se reutiliza la que ya tenia filtro y limite
 * xq reutilizo el componente publicacion-item? Para que se vean y funcionen igual en todas las pantallas
 */
import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Auth } from '../../servicios/auth';
import { PublicacionesService } from '../../servicios/publicaciones';
import { Publicacion } from '../../models/publicacion';
import { PublicacionItem } from '../publicacion-item/publicacion-item';

@Component({
  // Ahora también usa el componente de publi
  imports: [DatePipe, RouterLink, PublicacionItem],
  selector: 'app-mi-perfil',
  styleUrl: './mi-perfil.css',
  templateUrl: './mi-perfil.html',
})
export class MiPerfil implements OnInit {
  // protected para poder leer auth desde el HTML
  protected auth = inject(Auth);
  private service = inject(PublicacionesService);

  // ultimas publicaciones del usuario y si se estan cargando
  ultimas = signal<Publicacion[]>([]);
  cargando = signal(false);

  ngOnInit() {
    this.cargar();// Al abrir la pantalla las cargo
  }

  // Pido las 3 ult publicaciones del usuario logueado
  cargar() {
    const usuario = this.auth.usuario();
    if (!usuario) return;
    this.cargando.set(true);
    this.service.listar({ orden: 'fecha', offset: 0, limit: 3, usuarioId: usuario._id }).subscribe({
      next: (pagina) => {
        this.ultimas.set(pagina.items);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
  }
}