/**
 * Es el componente raíz (app-root): la carcasa que contiene toda la aplicación
 * Arranca main.ts. Importa los componentes que usa en su HTML
 *
 */

import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Navbar } from './componentes/navbar/navbar';
import { Modal } from './componentes/modal/modal';

@Component({
  imports: [RouterOutlet, Navbar, Modal],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {}