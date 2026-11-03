/**
 * Es la pantalla principal. Muestra el formulario para publicar y el listado paginado
 * -como pagino? Con offset y limit: offset = cuantas publicaciones saltear, limit = cuantas traer ej: Pag 2 con 5
 * El back tambien devuelve "total" para saber cuantas pag hay
 * -xq paginar en el back y no traer todo? Porque traer miles de publicaciones seria lento y pesado
 * -xq @for con track? Para que Angular identifique cada tarjeta por su _id y no las recree todas al cambiar la lista
 * -q hace el padre cuando un hijo emite "eliminada"? Recarga la lista (y retrocede de pag si quedo vacia)
 */
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { Auth } from '../../servicios/auth';
import { ModalService } from '../../servicios/modal';
import { PublicacionesService } from '../../servicios/publicaciones';
import { mensajesDeError, tituloDeError } from '../../utils/errores';
import { Orden, Publicacion } from '../../models/publicacion';
// Los dos componentes hijos que usa este HTML.
import { PublicacionItem } from '../publicacion-item/publicacion-item';
import { NuevaPublicacion } from '../nueva-publicacion/nueva-publicacion';

@Component({
  // importo los componentes hijos y routerLink para poder usarlos en el HTML
  imports: [PublicacionItem, NuevaPublicacion, RouterLink],
  selector: 'app-publicaciones',
  styleUrl: './publicaciones.css',
  templateUrl: './publicaciones.html',
})
export class Publicaciones implements OnInit {
  // Dependencias.
  protected auth = inject(Auth);
  private service = inject(PublicacionesService);
  private modal = inject(ModalService);

  readonly porPagina = 5;  // Cuantas publicaciones se muestran por pagina

  // Estado de la pantalla
  publicaciones = signal<Publicacion[]>([]);
  total = signal(0);
  offset = signal(0);
  orden = signal<Orden>('fecha');
  cargando = signal(false);

  // Valores calculados a partir de los anteriores
  // se actualizan solos
  paginaActual = computed(() => Math.floor(this.offset() / this.porPagina) + 1);// offset dividido por el tamaño de pag mas 1
  totalPaginas = computed(() => Math.max(1, Math.ceil(this.total() / this.porPagina))); // total dividido por el tamaño, redondeado hacia arriba (min 1)

  // si hay sesion, cargo el listado
  ngOnInit() {
    if (this.auth.usuario()) this.cargar();
  }

  // Pide al back la pag actual en el orden elegido
  cargar() {
    this.cargando.set(true);
    this.service.listar({ orden: this.orden(), offset: this.offset(), limit: this.porPagina }).subscribe({
      next: (pagina) => {
        this.publicaciones.set(pagina.items);
        this.total.set(pagina.total);
        this.cargando.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.cargando.set(false);
        this.modal.mostrar('error', tituloDeError(err.status), mensajesDeError(err));
      },
    });
  }

  // Cambio el orden: volvemos a la primera pagina y recargo
  cambiarOrden(valor: string) {
    this.orden.set(valor as Orden);
    this.offset.set(0);
    this.cargar();
  }

  // Pag anterior
  anterior() {
    this.offset.set(Math.max(0, this.offset() - this.porPagina));// Restamos una pag, sin bajar de 0
    this.cargar();
  }

  // Pag siguiente
  siguiente() {
    this.offset.set(this.offset() + this.porPagina);
    this.cargar();
  }

  // Se creo una publi
  // vuelvo al principio, con orden por fecha, para verla arriba
  alCrearse() {
    this.orden.set('fecha');
    this.offset.set(0);
    this.cargar();
  }

  // Se elimino una pubi
  alEliminarse() {
    // Si era la unica
    // retrocedemos una pag para no quedar en una vacia
    if (this.publicaciones().length === 1 && this.offset() > 0) {
      this.offset.set(this.offset() - this.porPagina);
    }
    this.cargar();
  }
}