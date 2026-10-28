/**
 * Controla la ventana (modal) de aviso.
 * Cualquier componente le dice a este servicio "mostra este mensaje"
 * y el componente Modal (componentes/modal) lo dibuja.
 * Lo usan Registro y Login; lo lee el componente Modal.
 *
 * El servicio guarda en un signal si está abierto y qué texto muestra
 * el componente Modal (en app.html) mira ese signal y se muestra con un @if.
 * Para qué sirve alCerrar? Es una función que se ejecuta cuando el usuario toca "Aceptar" (ej: ir al login).
 */
import { Service, signal } from '@angular/core';

export type TipoModal = 'exito' | 'error' | 'info';// Los 3 tipos de aviso posibles (cambian color e ícono)
// Forma del "estado" del modal, lo que necesita saber para dibujarse
interface EstadoModal {
  abierto: boolean; // se ve o no?
  tipo: TipoModal; // exito, error o info
  titulo: string; // título de la ventana
  mensajes: string[]; // lista de textos (string[]), el back puede devolver varios errores juntos
}

@Service()
export class ModalService {

  estado = signal<EstadoModal>({ abierto: false, tipo: 'info', titulo: '', mensajes: [] });

  private alCerrar?: () => void;

  // Abre el modal, mensajes puede ser un texto solo o una lista de textos
  mostrar(tipo: TipoModal, titulo: string, mensajes: string | string[], alCerrar?: () => void) {
    // Guardamos la función pendiente (o undefined si no vino ninguna)
    this.alCerrar = alCerrar;
    // set = reemplaza el valor del signal; la pantalla se actualiza sola
    this.estado.set({
      abierto: true, // lo abrimos
      tipo, //  
      titulo, // 
      // Si ya es una lista la dejamos; si es un solo texto lo metemos en una lista
      mensajes: Array.isArray(mensajes) ? mensajes : [mensajes],
    });
  }

  // Cierra el modal y ejecuta la funcion pendiente (si había)
  cerrar() {
    // update = cambia el signal a partir de su valor actual
    this.estado.update((e) => ({ ...e, abierto: false }));
    this.alCerrar?.();
    // La borramos para que no se ejecute dos veces
    this.alCerrar = undefined;
  }
}