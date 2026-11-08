import { Component, OnInit, inject, signal, computed} from '@angular/core';
import { DatePipe } from '@angular/common';
// ActivatedRoute = para leer el ":id" de la URL; RouterLink = link "Volver"
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { PublicacionesService } from '../../servicios/publicaciones';
import { ModalService } from '../../servicios/modal';
import { mensajesDeError, tituloDeError } from '../../utils/errores';
import { Publicacion } from '../../models/publicacion';
// El componente hijo con los comentarios
import { Comentarios } from '../comentarios/comentarios';
import { Auth } from '../../servicios/auth';

@Component({
  imports: [DatePipe, RouterLink, Comentarios],
  selector: 'app-publicacion',
  styleUrl: './publicacion.css',
  templateUrl: './publicacion.html',
})
// Se llama PublicacionDetalle para no chocar con la interface Publicacion
export class PublicacionDetalle implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private service = inject(PublicacionesService);
  private modal = inject(ModalService);
  protected auth = inject(Auth);

  // La publi (null mientras carga)
  publicacion = signal<Publicacion | null>(null);

  // Puedo eliminar si soy el autor o administrador
  puedeEliminar = computed(() => {
    const p = this.publicacion();
    const u = this.auth.usuario();
    return !!p && !!u && (p.usuario._id === u._id || u.perfil === 'administrador');
  });

  // Confirmacio con el modal y baja
  // al terminar, vuelvo al listado
  eliminar() {
    const p = this.publicacion();
    if (!p) return;
    this.modal.confirmar('Eliminar publicación', '¿Seguro que querés eliminar esta publicación?', () => {
      this.service.eliminar(p._id).subscribe({
        next: () => this.router.navigate(['/publicaciones']),
        error: (err: HttpErrorResponse) => this.modal.mostrar('error', tituloDeError(err.status), mensajesDeError(err)),
      });
    });
  }

  ngOnInit() {
    // snapshot.paramMap.get('id') lee el pedazo ":id" de /publicaciones/:id
    const id = this.route.snapshot.paramMap.get('id') ?? '';
    this.service.obtener(id).subscribe({
      next: (p) => this.publicacion.set(p),
      error: (err: HttpErrorResponse) => {
        // 401 ya lo maneja el interceptor; el resto modal y volvemos al listado
        if (err.status !== 401) {
          this.modal.mostrar('error', tituloDeError(err.status), mensajesDeError(err), () =>
            this.router.navigate(['/publicaciones']),
          );
        }
      },
    });
  }
}