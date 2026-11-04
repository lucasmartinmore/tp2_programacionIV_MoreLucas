import { Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Auth } from '../../servicios/auth';
import { ComentariosService } from '../../servicios/comentarios';
import { ModalService } from '../../servicios/modal';
import { mensajesDeError, tituloDeError } from '../../utils/errores';
import { Comentario } from '../../models/comentario';

@Component({
  imports: [DatePipe, ReactiveFormsModule],
  selector: 'app-comentarios',
  styleUrl: './comentarios.css',
  templateUrl: './comentarios.html',
})
export class Comentarios implements OnInit {
  // input.required = el padre DEBE pasarme el id de la publi
  publicacionId = input.required<string>();

  protected auth = inject(Auth);
  private service = inject(ComentariosService);
  private modal = inject(ModalService);

  
  readonly porTanda = 5;// Cuantos coment trae por tanda
  // Los comentarios mostrados (se van acumulando: "cargar mas" )
  comentarios = signal<Comentario[]>([]);
  // Total que hay en el servidor
  total = signal(0);
  cargando = signal(false);
  // quedan comentarios por mostrar? (computed = se recalcula solo cuando cambian sus signals)
  hayMas = computed(() => this.comentarios().length < this.total());
  // Id del comentario que se está editando (null = ninguno)
  editandoId = signal<string | null>(null);

  // Campo del comentario nuevo: obligatorio y máx. 500
  nuevo = new FormControl('', [Validators.required, Validators.maxLength(500)]);
  // Campo de edición
  edicion = new FormControl('', [Validators.required, Validators.maxLength(500)]);

  // Al crearse el componente, traemos la primera tanda
  ngOnInit() {
    this.cargar();
  }

  // Trae la siguiente tanda: offset = cuantos ya tengo
  cargar() {
    this.cargando.set(true);
    this.service.listar(this.publicacionId(), this.comentarios().length, this.porTanda).subscribe({
      next: (pagina) => {
        // Sumamos los nuevos AL FINAL de los que ya había
        this.comentarios.update((lista) => [...lista, ...pagina.items]);
        this.total.set(pagina.total);
        this.cargando.set(false);
      },
      error: (err: HttpErrorResponse) => this.fallo(err),
    });
  }

  // Publica un comentario nuevo
  enviar() {
    if (this.nuevo.invalid) {
      this.nuevo.markAsTouched();
      return;
    }
    this.service.crear(this.publicacionId(), this.nuevo.value ?? '').subscribe({
      next: (creado) => {
        // Lo ponemos ARRIBA (son más recientes primero) sin recargar todo
        this.comentarios.update((lista) => [creado, ...lista]);
        this.total.update((t) => t + 1);
        this.nuevo.reset('');
      },
      error: (err: HttpErrorResponse) => this.fallo(err),
    });
  }

  // este coment es mio? (yo solo veo el boton de edit)
  esMio(c: Comentario) {
    return c.usuario._id === this.auth.usuario()?._id;
  }

  // Entra en modo edicion con el texto actual
  editar(c: Comentario) {
    this.editandoId.set(c._id);
    this.edicion.setValue(c.mensaje);
  }

  // Sale del modo edición sin guardar
  cancelar() {
    this.editandoId.set(null);
  }

  // Guarda la edicion (PUT)
  guardar(c: Comentario) {
    if (this.edicion.invalid) {
      this.edicion.markAsTouched();
      return;
    }
    this.service.modificar(this.publicacionId(), c._id, this.edicion.value ?? '').subscribe({
      next: (actualizado) => {
        // Reemplazo solo ese comentario en la lista (map recorre y cambia el que coincide)
        this.comentarios.update((lista) => lista.map((x) => (x._id === actualizado._id ? actualizado : x)));
        this.editandoId.set(null);
      },
      error: (err: HttpErrorResponse) => this.fallo(err),
    });
  }

  // Muestra el error en el modal
  private fallo(err: HttpErrorResponse) {
    this.cargando.set(false);
    this.modal.mostrar('error', tituloDeError(err.status), mensajesDeError(err));
  }
}