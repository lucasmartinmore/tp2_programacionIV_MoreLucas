/**
 * Pantalla "Mi perfil".
 * Muestra los datos del usuario logueado (foto, nombre, usuario, correo, nacimiento, descripción, perfil).
 * Lee el usuario desde el servicio Auth (el mismo que guardó el login).
 *
 * - ¿De dónde salen los datos? El login devolvió al usuario y Auth lo guardó en un signal y en localStorage.
 * - ¿Qué pasa sin haber iniciado sesión? Se muestra "No iniciaste sesión" con un botón al login (sin guards).
 * - ¿Para qué es DatePipe? Un "pipe" transforma un valor para mostrarlo; este muestra la fecha como dd/MM/yyyy.
 */

import { Component } from '@angular/core';
import { DatePipe } from '@angular/common';// DatePipe = el pipe "date" que formatea fechas en el HTML
import { RouterLink } from '@angular/router';
import { Auth } from '../../servicios/auth';

@Component({
  imports: [DatePipe, RouterLink],
  selector: 'app-mi-perfil',
  styleUrl: './mi-perfil.css',
  templateUrl: './mi-perfil.html',
})
export class MiPerfil {
  // Inyección por constructor; protected para poder usar auth desde el HTML
  constructor(protected auth: Auth) {}
}