/**
 * Pantalla de Registro (crear cuenta).
 * El formulario (campos, validaciones y foto) vive en el componente compartido FormularioUsuario,
 * el mismo que usa el administrador para dar de alta. Acá solo mando lo que ese formulario emite
 * Se conecta con Auth (llama al back), ModalService y Router
 */
import { Component, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { Auth } from '../../servicios/auth';
import { ModalService } from '../../servicios/modal';
import { mensajesDeError, tituloDeError } from '../../utils/errores';
import { FormularioUsuario } from '../formulario-usuario/formulario-usuario';

@Component({
  imports: [RouterLink, FormularioUsuario],
  selector: 'app-registro',
  styleUrl: './registro.css',
  templateUrl: './registro.html',
})
export class Registro {
  // enviando = signal que vale true mientras esperamos la respuesta del back
  enviando = signal(false);

  constructor(
    private auth: Auth,
    private modal: ModalService,
    private router: Router,
  ) {}

  // Se ejecuta cuando el formulario compartido ya valido todo y emite el FormData
  enviar(formData: FormData) {
    // Avisamos que empezó el envío
    // (deshabilita el botón)
    this.enviando.set(true);

    this.auth.register(formData).subscribe({
      // Registro correcto
      next: () => {
        this.enviando.set(false);
        // Modal de éxito
        this.modal.mostrar('exito', '¡Cuenta creada!', 'Ya estás dentro.', () => this.router.navigate(['/publicaciones']));
      },
      // Error (400, 409, sin conexión...)
      error: (err: HttpErrorResponse) => {
        this.enviando.set(false);
        // Modal de error con título y
        // mensajes según el código de estado
        this.modal.mostrar('error', tituloDeError(err.status), mensajesDeError(err));
      },
    });
  }
}