/**
 * Es el componente de una publi
 * Muestra una publi y resuelve sus acciones: me gusta y eliminar
 * - que es input()? Es la forma moderna de recibir datos del componente padre: <app-publicacion-item [publicacion]="p" />.
 *   input.required significa que el padre esta obligado a pasarlo
 * - que es output()? La forma de AVISARLE al padre que paso algo (ej: "me eliminaron")
 *   El hijo no modifica la lista del padre: avisa, y el padre decide
 * - que es computed()? Un valor que se recalcula solo cuando cambian las señales de las que depende
 * - xq se actualiza solo el contador? Porque cantidad y leDiMeGusta son signals: al cambiar, la vista se redibuja
 * - xq ngOnInit y no el constructor? Porque los inputs recien tienen valor cuando el componente ya esta armado
 */
import { Component, OnInit, computed, inject, input, output, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Auth } from '../../servicios/auth';
import { ModalService } from '../../servicios/modal';
import { PublicacionesService } from '../../servicios/publicaciones';
import { mensajesDeError, tituloDeError } from '../../utils/errores';
import { Publicacion } from '../../models/publicacion';// El tipo de dato de una publi
import { RouterLink } from '@angular/router';
import { TiempoRelativoPipe } from '../../pipes/tiempo-relativo.pipe';
import { RecortarPipe } from '../../pipes/recortar.pipe';
import { InicialesPipe } from '../../pipes/iniciales.pipe';

@Component({
  imports: [RouterLink, TiempoRelativoPipe, RecortarPipe, InicialesPipe],
  selector: 'app-publicacion-item',
  styleUrl: './publicacion-item.css',
  templateUrl: './publicacion-item.html',
})
export class PublicacionItem implements OnInit {
  publicacion = input.required<Publicacion>();//publi que el padre nos pasa (obligatoria)
  eliminada = output<string>();//emite el id de la publi cuando se elimino correctamente

  // Dependencias con inject().
  protected auth = inject(Auth);
  private service = inject(PublicacionesService);
  private modal = inject(ModalService);

  cantidad = signal(0);// cantidad de mg
  leDiMeGusta = signal(false);// si usuario logueado ya dio mg
  procesando = signal(false);// ya hay una peticion en curso, evito doble click

  // comparo el id del usuario logueado con el del autor
  esMia = computed(() => this.auth.usuario()?._id === this.publicacion().usuario._id);
  // El boton Eliminar aparece si la publi es mia O si soy administrador
  puedeEliminar = computed(() => this.esMia() || this.auth.usuario()?.perfil === 'administrador');

  // Se ejecuta una vez cuando el componente ya recibio su publi
  ngOnInit() {
    this.cantidad.set(this.publicacion().cantidadMeGusta);// Copio los valores iniciales de la publi
    this.leDiMeGusta.set(this.publicacion().meGusta.includes(this.auth.usuario()?._id ?? ''));// si el usuario figura en la lista de quien dio mg
  }

  // Ejecuto al tocar el like: si ya di lo quito, sino le pongo
  alternarMeGusta() {
    // Sin sesion o con petición en curso, no hace nada
    const usuario = this.auth.usuario();
    if (!usuario || this.procesando()) return;

    this.procesando.set(true);
    const id = this.publicacion()._id;
    const peticion = this.leDiMeGusta()
      ? this.service.quitarMeGusta(id)
      : this.service.darMeGusta(id);

    // Ejecutamos la peticion
    peticion.subscribe({
      next: (resumen) => {
        // Actualizamos con lo que dice el back (es la verdad, no lo que "creemos").
        this.cantidad.set(resumen.cantidadMeGusta);
        this.leDiMeGusta.set(resumen.meGusta.includes(usuario._id));
        this.procesando.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.procesando.set(false);
        this.modal.mostrar('error', tituloDeError(err.status), mensajesDeError(err));
      },
    });
  }

  // EJecuto al tocar eliminar
  pedirConfirmacion() {
    this.modal.confirmar(
      'Eliminar publicación',
      `¿Seguro que querés eliminar "${this.publicacion().titulo}"? Esta acción no se puede deshacer.`,
      () => this.eliminar(),
    );
  }

  // Baja logica para el back
  private eliminar() {
    const usuario = this.auth.usuario();
    if (!usuario) return;
    const id = this.publicacion()._id;

    this.service.eliminar(id).subscribe({
      //le avisamos al padre para que saque la tarjeta de la lista
      next: () => this.eliminada.emit(id),
      error: (err: HttpErrorResponse) =>
        this.modal.mostrar('error', tituloDeError(err.status), mensajesDeError(err)),
    });
  }
}