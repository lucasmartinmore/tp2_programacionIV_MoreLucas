import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { Auth } from '../../servicios/auth';
import { UsuariosService } from '../../servicios/usuarios';
import { ModalService } from '../../servicios/modal';
import { mensajesDeError, tituloDeError } from '../../utils/errores';
import { fechaNoFuturaValidator } from '../../validators/usuario.validators';

@Component({
  imports: [ReactiveFormsModule, RouterLink],
  selector: 'app-editar-perfil',
  styleUrl: './editar-perfil.css',
  templateUrl: './editar-perfil.html',
})
export class EditarPerfil {
  private auth = inject(Auth);
  private service = inject(UsuariosService);
  private modal = inject(ModalService);
  private router = inject(Router);

  // no es null porque la ruta esta protegida por el guard
  private usuario = this.auth.usuario()!;

  // Formulario con los datos actuales como valores iniciales
  form = new FormGroup({
    nombre: new FormControl(this.usuario.nombre, [Validators.required]),
    apellido: new FormControl(this.usuario.apellido, [Validators.required]),
    // La fecha llega como "2000-05-20T00:00:00.000Z"
    // el input date necesita solo "2000-05-20"
    fechaNacimiento: new FormControl(this.usuario.fechaNacimiento.slice(0, 10), [
      Validators.required,
      fechaNoFuturaValidator(),
    ]),
    descripcion: new FormControl(this.usuario.descripcion, [Validators.maxLength(200)]),
  });

  // Foto nueva (opcional)
  archivo: File | null = null;
  enviando = signal(false);

  // Se ejecuta al elegir una imagen en el input file
  alElegirArchivo(evento: Event) {
    const input = evento.target as HTMLInputElement;
    this.archivo = input.files?.[0] ?? null;
  }

  guardar() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    // FormData porque puede llevar la imagen
    const formData = new FormData();
    Object.entries(this.form.getRawValue()).forEach(([clave, valor]) => formData.append(clave, valor ?? ''));
    // 'imagenPerfil' es el nombre que espera el back
    if (this.archivo) formData.append('imagenPerfil', this.archivo);

    this.enviando.set(true);
    this.service.actualizarPerfil(formData).subscribe({
      next: (actualizado) => {
        this.enviando.set(false);
        // Actualizamos el usuario guardado: la navbar y Mi Perfil se ven con los datos nuevos
        this.auth.actualizarUsuario(actualizado);
        this.modal.mostrar('exito', 'Perfil actualizado', 'Tus datos se guardaron.', () =>
          this.router.navigate(['/mi-perfil']),
        );
      },
      error: (err: HttpErrorResponse) => {
        this.enviando.set(false);
        this.modal.mostrar('error', tituloDeError(err.status), mensajesDeError(err));
      },
    });
  }
}