/**
 Lee el estado del ModalService. Esta puesto una sola vez en app.html.
 *
 * - ¿Cómo sabe cuándo mostrarse? Su HTML mira el signal modal.estado(); cuando abierto es true, se dibuja
 * - ¿Por qué el servicio es protected? Porque el HTML necesita leerlo (un private no se puede usar en el template).
 */

import { Component } from '@angular/core';
import { ModalService } from '../../servicios/modal';

@Component({
  selector: 'app-modal',
  styleUrl: './modal.css',
  templateUrl: './modal.html',
})
export class Modal {
  // protected = se puede leer desde el HTML (con private no se podría)
  constructor(protected modal: ModalService) {}
}