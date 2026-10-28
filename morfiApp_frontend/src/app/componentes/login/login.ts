/**
 * Pantalla de Login (iniciar sesión).
 * El usuario escribe su correo O usuario y su contraseña; se mandan al back y, si es correcto,
 * se lo lleva a publicaciones
 * Se conecta con Auth (llamar al back), ModalService (avisos) y Router (cambiar de pantalla).
 *
 * - ¿Qué es un formulario reactivo? Un formulario definido en el TypeScript (FormGroup con un FormControl por
 *   campo) y conectado después al HTML; permite validar y leer valores desde el código.
 * - ¿Qué pasa si la contraseña es incorrecta? El back responde 401; el "error" del subscribe lo atrapa y se muestra un modal
 */

import { Component, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { Auth } from '../../servicios/auth';
import { ModalService } from '../../servicios/modal';
import { mensajesDeError, tituloDeError } from '../../utils/errores';
import { PATRON_PASSWORD } from '../../validators/usuario.validators';

@Component({
  imports: [ReactiveFormsModule, RouterLink],
  selector: 'app-login',
  styleUrl: './login.css',
  templateUrl: './login.html',
})
export class Login {
  form = new FormGroup({
    // Correo o nombre de usuario: solo exijo que no esté vacío (required)
    identificador: new FormControl('', [Validators.required]),
    password: new FormControl('', [Validators.required, Validators.pattern(PATRON_PASSWORD)]),
  });
  // signal que indica si estamos esperando la respuesta del back (false = no)
  enviando = signal(false);

  constructor(
    private auth: Auth,
    private modal: ModalService,
    private router: Router,
  ) {}

  // Devuelve el mensaje de error de un campo, o null si está bien o aún no lo tocó el usuario
  mensaje(campo: string): string | null {
    const c = this.form.get(campo);
    // touched = el usuario ya entró y salió del campo; así no mostramos errores antes de tiempo
    if (!c || !c.touched || !c.errors) return null;
    // Falta completar el campo
    if (c.hasError('required')) return 'Este campo es obligatorio';
    // No cumple la expresión regular de la contraseña
    if (c.hasError('pattern')) return 'Mínimo 8 caracteres, una mayúscula y un número';
    // Cualquier otro error
    return 'Valor inválido';
  }

  // Se ejecuta al enviar el formulario ---> "Ingresar")
  enviar() {
    // Si hay errores: los marcamos todos como seleccionados para que se vean los mensajes y no seguimos
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    // getRawValue() devuelve un objeto con el valor de cada campo; lo desarmamos en dos variables
    const { identificador, password } = this.form.getRawValue();

    // Avisamos que empezó el envío (deshabilita el botón)
    this.enviando.set(true);

    // .subscribe = "ejecutá la petición y avisame qué pasó": next = respondió bien; error = respondió con error
    this.auth.login(identificador ?? '', password ?? '').subscribe({
      // Respuesta correcta (200): usuario es lo que devolvió el back
      next: (usuario) => {
        // Terminó el envío
        this.enviando.set(false);
        // Modal de éxito; al tocar "Aceptar" se ejecuta la función y navegamos a Publicaciones
        this.modal.mostrar('exito', `¡Hola, ${usuario.nombre}!`, 'Ingresaste correctamente.', () =>
          this.router.navigate(['/publicaciones']),
        );
      },
      // Error (401, 400, sin conexion...)
      error: (err: HttpErrorResponse) => {
        // Termino el envío
        this.enviando.set(false);
        // Modal de error con título y mensajes segun el código de estado
        this.modal.mostrar('error', tituloDeError(err.status), mensajesDeError(err));
      },
    });
  }
}