/**
 * Pantalla de Registro (crear cuenta).
 * Pide nombre, apellido, correo, usuario, contraseña (dos veces), fecha de nacimiento,
 * descripción breve y foto opcional. Valida todo y lo manda al back
 * Se conecta con Auth (llama al back), ModalService , Router y los validators propios.
 *
 * - ¿Por qué no mandás repetirPassword? Solo sirve para comprobar en el front; el back rechaza campos desconocidos (400).
 * - ¿Para qué updateValueAndValidity en ngOnInit? Si se cambia la contraseña DESPUÉS de repetirla, hay que re-comprobar.
 * - ¿Qué pasa si el correo ya existe? El back responde 409 y se muestra un modal de error.
 */

import { Component, OnInit, signal } from '@angular/core';
// Validators = reglas que trae Angular (required, email, minLength...)
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';// ReactiveFormsModule = habilita [formGroup] en el HTML;
import { HttpErrorResponse } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { Auth } from '../../servicios/auth';// Auth = servicio que habla con el back
import { ModalService } from '../../servicios/modal';
import { mensajesDeError, tituloDeError } from '../../utils/errores';// Funciones que traducen un error del back a texto para el modal
//reglas propias
import {
  PATRON_PASSWORD,
  clavesCoincidenValidator,
  fechaNoFuturaValidator,
} from '../../validators/usuario.validators';

@Component({
  imports: [ReactiveFormsModule, RouterLink],
  selector: 'app-registro',
  styleUrl: './registro.css',
  templateUrl: './registro.html',
})
export class Registro implements OnInit {
  // El campo contraseña va en una variable aparte porque "repetir contraseña" necesita compararse con él
  controlPassword = new FormControl('', [Validators.required, Validators.pattern(PATRON_PASSWORD)]);

  form = new FormGroup({
    nombre: new FormControl('', [Validators.required, Validators.minLength(2), Validators.maxLength(30)]),
    apellido: new FormControl('', [Validators.required, Validators.minLength(2), Validators.maxLength(30)]),
    email: new FormControl('', [Validators.required, Validators.email]),
    username: new FormControl('', [Validators.required, Validators.minLength(3), Validators.maxLength(20)]),
    password: this.controlPassword,// Contraseña: reutilizamos el campo creado arriba
    repetirPassword: new FormControl('', [
      Validators.required,
      clavesCoincidenValidator(this.controlPassword),// Validator propio: compara con la contraseña
    ]),
    fechaNacimiento: new FormControl('', [Validators.required, fechaNoFuturaValidator()]),// Fecha de nacimiento: obligatoria y no futura (validator propio)
    descripcion: new FormControl('', [Validators.maxLength(200)]),
  });

  // null = no eligió ninguno
  archivo: File | null = null;
  errorArchivo = signal<string | null>(null);// errorArchivo = signal con el mensaje si la foto no es válida (null = sin error)
  preview = signal<string | null>(null); // preview = signal con la dirección temporal para mostrar la foto elegida
  // enviando = signal que vale true mientras esperamos la respuesta del back
  enviando = signal(false);

  constructor(
    private auth: Auth,
    private modal: ModalService,
    private router: Router,
  ) {}

  // ngOnInit se ejecuta una vez, cuando la pantalla ya está lista
  ngOnInit() {
    // valueChanges avisa cada vez que cambia la contraseña
    // subscribe "ejecuta esto cada vez que avise"
    this.controlPassword.valueChanges.subscribe(() =>
      // Volvemos a validar "repetir contraseña" por si ya no coincide
      this.form.controls.repetirPassword.updateValueAndValidity(),
    );
  }

  // Devuelve el primer mensaje de error de un campo, o null si está bien o todavía no lo tocó el usuario
  mensaje(campo: string): string | null {
    // Buscamos el campo por su nombre dentro del formulario
    const c = this.form.get(campo);
    // touched = el usuario ya entró y salió del campo; así no mostramos errores antes de tiempo
    if (!c || !c.touched || !c.errors) return null;
    // Campo vacío
    if (c.hasError('required')) return 'Este campo es obligatorio';
    // Formato de correo invalido
    if (c.hasError('email')) return 'Ingresá un correo válido';
    // Muy corto
    if (c.hasError('minlength')) return `Mínimo ${c.errors['minlength'].requiredLength} caracteres`;
    // Muy largo
    if (c.hasError('maxlength')) return `Máximo ${c.errors['maxlength'].requiredLength} caracteres`;
    // No cumple el formato de contraseña
    if (c.hasError('pattern')) return 'Mínimo 8 caracteres, una mayúscula y un número';
    // Error de mi validator propio: claves distintas
    if (c.hasError('losControlesNoCoinciden')) return 'Las contraseñas no coinciden';
    // Error de mi validator propio: fecha futura
    if (c.hasError('fechaFutura')) return 'La fecha no puede ser futura';
    // Cualquier otro error
    return 'Valor inválido';
  }

  // Se ejecuta cuando el usuario elige un archivo en el input de la foto
  alElegirArchivo(event: Event) {
    const input = event.target as HTMLInputElement; // event.target es el input donde se eligió el archivo
    const file = input.files?.[0] ?? null; // Primer archivo elegido (o null si canceló)

    //limpiamos todo lo anterior
    this.archivo = null;
    this.preview.set(null);
    this.errorArchivo.set(null);
    // Si no hay archivo, terminamos
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      this.errorArchivo.set('Solo se aceptan imágenes JPG, PNG o WEBP');
      input.value = '';
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      this.errorArchivo.set('La imagen no puede superar los 2 MB');
      input.value = '';
      return;
    }

    this.archivo = file;
    // Generamos una dirección temporal para mostrar la vista previa
    this.preview.set(URL.createObjectURL(file));
  }

  // Se ejecuta al enviar el formulario
  enviar() {
    // Si hay errores: los marcamos como seleccionados para que se vean los mensajes y no seguimos
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    // Separamos repetirPassword del resto, es solo para el front 
    const { repetirPassword, ...datos } = this.form.getRawValue();

    // FormData = "paquete" de campos que puede llevar archivos
    const formData = new FormData();
    // Recorremos cada campo (clave/valor) y lo agregamos al paquete; ?? '' pone texto vacío si el valor es null
    Object.entries(datos).forEach(([clave, valor]) => formData.append(clave, valor ?? ''));
    // Si hay foto la agregamos. 'imagenPerfil' tiene que ser EXACTAMENTE el nombre que espera el back
    if (this.archivo) formData.append('imagenPerfil', this.archivo);

    // Avisamos que empezó el envío (deshabilita el botón)
    this.enviando.set(true);

    // .subscribe ejecuta la petición. next = respuesta correcta (201); error = el back respondió con error
    this.auth.register(formData).subscribe({
      // Registro correcto
      next: () => {
        this.enviando.set(false);
        // Modal de éxito; al tocar "Aceptar" navegamos al login
        this.modal.mostrar('exito', '¡Cuenta creada!', 'Ya podés iniciar sesión con tus datos.', () =>
          this.router.navigate(['/login']),
        );
      },
      // Error (400, 409, sin conexión...)
      error: (err: HttpErrorResponse) => {
        this.enviando.set(false);
        // Modal de error con título y mensajes según el código de estado
        this.modal.mostrar('error', tituloDeError(err.status), mensajesDeError(err));
      },
    });
  }
}