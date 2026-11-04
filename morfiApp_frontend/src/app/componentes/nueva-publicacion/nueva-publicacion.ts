/**
 * Form para crear una publicación (título, mensaje, imagen opcional)
 * xq FormData? Porque lleva un archivo; el JSON no puede llevar archivos
 * q es viewChild? Una forma de acceder desde el .ts a un elemento del HTML marcado con #nombre
 * Lo usamos para vaciar el input de archivo despues de publicar (los formularios reactivos no controlan los inputs file)
 * xq output() "creada"? Para avisarle a la pantalla padre que recargue la lista
 * Se valida en el front y en el back? Sí: el front da respuesta rapida; el back es la validacion que realmente protege
 */
import { Component, ElementRef, inject, output, signal, viewChild } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Auth } from '../../servicios/auth';
import { ModalService } from '../../servicios/modal';
import { PublicacionesService } from '../../servicios/publicaciones';
import { mensajesDeError, tituloDeError } from '../../utils/errores';

@Component({
  // ReactiveFormsModule = lo que hace funcionar [formGroup] y formControlName en el HTML
  imports: [ReactiveFormsModule],
  selector: 'app-nueva-publicacion',
  styleUrl: './nueva-publicacion.css',
  templateUrl: './nueva-publicacion.html',
})
export class NuevaPublicacion {
  creada = output<void>();// aviso al padre que se creo una publi
  // Dependencias.
  private auth = inject(Auth);
  private service = inject(PublicacionesService);
  private modal = inject(ModalService);

  // Referencia al <input type="file" #inputArchivo> del HTML
  inputArchivo = viewChild<ElementRef<HTMLInputElement>>('inputArchivo');

  // Archivo elegido 
  // no va dentro del form
  archivo: File | null = null;
  // Vista previa de la imagen, mensaje de error del archivo y estado de envio
  preview = signal<string | null>(null);
  errorArchivo = signal<string | null>(null);
  enviando = signal(false);

  // El formulario: dos campos con sus reglas
  // nonNullable evita que reset() deje null
  form = new FormGroup({
    // Obligatorio
    titulo: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.pattern(/\S/), Validators.maxLength(100)] }),
    mensaje: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.pattern(/\S/), Validators.maxLength(1000)] }),
  });

  // Devuelve el mensaje de error de un campo 
  errorDe(campo: 'titulo' | 'mensaje'): string | null {
    const c = this.form.controls[campo];
    if (!c.touched || !c.errors) return null;// touched = el usuario ya entro y salio del campo
    if (c.hasError('required') || c.hasError('pattern')) return 'Este campo es obligatorio';
    if (c.hasError('maxlength')) return `Máximo ${c.errors['maxlength'].requiredLength} caracteres`;
    return 'Valor inválido';
  }

  // Se ejecuta al elegir un archivo
  alElegirArchivo(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    // Limpio lo anterior
    this.archivo = null;
    this.preview.set(null);
    this.errorArchivo.set(null);
    if (!file) return;

    // Solo JPG, PNG o WEBP 
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      this.errorArchivo.set('Solo se aceptan imágenes JPG, PNG o WEBP');
      input.value = '';
      return;
    }
    // Maximo 2 MB
    if (file.size > 2 * 1024 * 1024) {
      this.errorArchivo.set('La imagen no puede superar los 2 MB');
      input.value = '';
      return;
    }
    // Archivo valido
    // lo guardamos y generamos una vista previa
    this.archivo = file;
    this.preview.set(URL.createObjectURL(file));
  }

  // Se ejecuta al enviar el formulario
  enviar() {
    const usuario = this.auth.usuario();// Sin sesión no se puede publicar
    if (!usuario) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    // Armamos el paquete multipart
    const { titulo, mensaje } = this.form.getRawValue();
    const formData = new FormData();
    formData.append('titulo', titulo);
    formData.append('mensaje', mensaje);

    if (this.archivo) formData.append('imagen', this.archivo);// 'imagen' tiene que ser EXACTAMENTE el nombre que espera el back en FileInterceptor
    this.enviando.set(true);
    this.service.crear(formData).subscribe({
      next: () => {
        this.enviando.set(false);
        this.limpiar();
        this.modal.mostrar('exito', '¡Publicación creada!', 'Tu receta ya aparece en el listado.');
        this.creada.emit();// Aviso al padre para que recargue
      },
      error: (err: HttpErrorResponse) => {
        this.enviando.set(false);
        this.modal.mostrar('error', tituloDeError(err.status), mensajesDeError(err));
      },
    });
  }

  // Dej el form como nuevo
  private limpiar() {
    this.form.reset();
    this.archivo = null;
    this.preview.set(null);
    this.errorArchivo.set(null);
    // Vacio el imput
    const input = this.inputArchivo()?.nativeElement;
    if (input) input.value = '';
  }
}