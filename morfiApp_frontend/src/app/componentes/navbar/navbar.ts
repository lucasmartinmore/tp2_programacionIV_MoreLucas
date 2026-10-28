/**
 * Permite moverse entre pantallas y muestra "Salir" si hay un usuario logueado,
 * o "Ingresar / Registrarse" si no lo hay.
 * Lo lee el usuario del servicio Auth y usa el Router para navegar.
 *
 * - ¿Cómo sabe si hay alguien logueado? Lee el signal auth.usuario(): con usuario muestra "Salir", con null los links de ingreso.
 * - ¿Qué hace routerLink? Navega a otra ruta sin recargar la página (es una SPA: Single Page Application).
 * - ¿Y routerLinkActive? Le agrega la clase "active" al link de la pantalla actual.
 */
import { Component } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { Auth } from '../../servicios/auth';// Auth = servicio que sabe quién está logueado

@Component({
  imports: [RouterLink, RouterLinkActive],
  selector: 'app-navbar',
  styleUrl: './navbar.css',
  templateUrl: './navbar.html',
})
export class Navbar {
  // Inyección por constructor. auth es protected para leerlo desde el HTML; router es private porque solo lo usa esta clase
  constructor(
    protected auth: Auth,
    private router: Router,
  ) {}

  // Se ejecuta al tocar "Salir": cierra la sesión y lleva al login
  salir() {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}