/**
 * Formulario de datos de usuario, compartido por el Registro y por el alta del administrador
 * si está bien, EMITE un FormData listo para mandar al back
 * Quien lo usa (registro o dashboard) decide a qué ruta del back lo manda
 *
 *[conPerfil]: si es true muestra los radio buttons usuario/administrador (solo para el admin)
 * xq no uso repetirPassword? Solo sirve para comprobar en el front; el back rechaza campos desconocidos (400)
 * xq updateValueAndValidity en ngOnInit? Si se cambia la contraseña DESPUÉS de repetirla, hay que re-comprobar
 */
import { Component, ElementRef, OnInit, input, output, signal, viewChild } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { PATRON_PASSWORD, clavesCoincidenValidator, fechaNoFuturaValidator } from '../../validators/usuario.validators';

@Component({
  imports: [ReactiveFormsModule],
  selector: 'app-formulario-usuario',
  styleUrl: './formulario-usuario.css',
  templateUrl: './formulario-usuario.html',
})
export class FormularioUsuario implements OnInit {
  // ENTRADAS (las manda el componente padre)
  conPerfil = input(false); // mostrar eleccion del perfil?
  enviando = input(false); // el padre esta esperando al back?
  textoBoton = input('Registrarme');
  textoEnviando = input('Creando cuenta...');

  // SALIDA: cuando todo es válido
  // avisa al padre y le pasa el paquete de datos
  enviado = output<FormData>();

  // Referencia al input de la foto
  private foto = viewChild<ElementRef<HTMLInputElement>>('foto');

  // El campo contraseña va en una variable aparte 
  // porque "repetir contraseña" necesita compararse con el
  controlPassword = new FormControl('', [Validators.required, Validators.pattern(PATRON_PASSWORD)]);

  form = new FormGroup({
    nombre: new FormControl('', [Validators.required, Validators.minLength(2), Validators.maxLength(30)]),
    apellido: new FormControl('', [Validators.required, Validators.minLength(2), Validators.maxLength(30)]),
    email: new FormControl('', [Validators.required, Validators.email]),
    username: new FormControl('', [Validators.required, Validators.minLength(3), Validators.maxLength(20)]),
    password: this.controlPassword, 
    repetirPassword: new FormControl('', [
      Validators.required,
      clavesCoincidenValidator(this.controlPassword), // Validator propio
    ]),
    fechaNacimiento: new FormControl('', [Validators.required, fechaNoFuturaValidator()]),
    descripcion: new FormControl('', [Validators.maxLength(200)]),
    // Solo se usa si conPerfil() es true. nonNullable: al hacer reset() vuelve a 'usuario'
    perfil: new FormControl<'usuario' | 'administrador'>('usuario', { nonNullable: true }),
  });

  // null = no eligió ninguno
  archivo: File | null = null;
  errorArchivo = signal<string | null>(null); // mensaje si la foto no es válida (null = sin error)
  preview = signal<string | null>(null); // dirección temporal para mostrar la foto elegida

  ngOnInit() {
    // valueChanges avisa cada vez que cambia la contraseña
    // vuelvo a validar "repetir contraseña"
    this.controlPassword.valueChanges.subscribe(() => this.form.controls.repetirPassword.updateValueAndValidity());
  }

  // Devuelve el primer mensaje de error de un campo
  //  o null si está bien o todavía no lo tocó el usuario
  mensaje(campo: string): string | null {
    const c = this.form.get(campo);
    // touched = el usuario ya entró y salió del campo
    //  así no mostramos errores antes de tiempo
    if (!c || !c.touched || !c.errors) return null;
    if (c.hasError('required')) return 'Este campo es obligatorio';
    if (c.hasError('email')) return 'Ingresá un correo válido';
    if (c.hasError('minlength')) return `Mínimo ${c.errors['minlength'].requiredLength} caracteres`;
    if (c.hasError('maxlength')) return `Máximo ${c.errors['maxlength'].requiredLength} caracteres`;
    if (c.hasError('pattern')) return 'Mínimo 8 caracteres, una mayúscula y un número';
    // Error de mi validator propio
    if (c.hasError('losControlesNoCoinciden')) return 'Las contraseñas no coinciden';
    // Error de mi validator propio
    if (c.hasError('fechaFutura')) return 'La fecha no puede ser futura';
    return 'Valor inválido';
  }

  // Se ejecuta cuando el usuario elige un archivo en el input de la foto
  alElegirArchivo(event: Event) {
    const input = event.target as HTMLInputElement; // event.target es el input donde se eligió el archivo
    const file = input.files?.[0] ?? null; // Primer archivo elegido (o null si canceló)

    // limpip todo lo anterior
    this.archivo = null;
    this.preview.set(null);
    this.errorArchivo.set(null);
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
    // Genero una dirección temporal para mostrar la vista previa
    this.preview.set(URL.createObjectURL(file));
  }

  // Se ejecuta al enviar el formulario
  enviar() {
    // Si hay errores: marco todo como tocado para que se vean los mensajes y no seguimos
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    // Separamos repetirPassword y perfil del resto
    const { repetirPassword, perfil, ...datos } = this.form.getRawValue();

    const formData = new FormData();
    // Recorremos cada campo (clave/valor)
    Object.entries(datos).forEach(([clave, valor]) => formData.append(clave, valor ?? ''));
    if (this.conPerfil()) formData.append('perfil', perfil);
    if (this.archivo) formData.append('imagenPerfil', this.archivo);

    // Le entregamos el paquete al padre
    this.enviado.emit(formData);
  }

  // El padre lo llama cuando el alta salió bien
  //  deja el formulario limpio para cargar otro
  reiniciar() {
    this.form.reset();
    this.archivo = null;
    this.preview.set(null);
    this.errorArchivo.set(null);
    const f = this.foto();
    if (f) f.nativeElement.value = '';
  }
}