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

export type TipoModal = 'exito' | 'error' | 'info';// Los 3 tipos de aviso posibles (cambian color/icono)

// Forma del "estado" del modal
// lo que necesita saber para dibujarse
interface EstadoModal {
  abierto: boolean; // se ve?
  tipo: TipoModal; // exito, error o info
  titulo: string; // titulo de la ventana
  mensajes: string[]; // lista de textos
  confirmacion: boolean; //true = pregunta con dos botones (cancelar/confirmar)
}
@Service()
export class ModalService {
  // estado = arranca cerrado y vacio
  estado = signal<EstadoModal>({ abierto: false, tipo: 'info', titulo: '', mensajes: [], confirmacion: false });

  // Función a ejecutar al aceptar o cerrar
  private alCerrar?: () => void;

  // Aviso simple (un boton "Aceptar")
  mostrar(tipo: TipoModal, titulo: string, mensajes: string | string[], alCerrar?: () => void) {
    this.abrir(tipo, titulo, mensajes, false, alCerrar);
  }

  // pregunta con dos botones
  // se ejecuta si el usuario confirma
  confirmar(titulo: string, mensajes: string | string[], alConfirmar: () => void) {
    this.abrir('info', titulo, mensajes, true, alConfirmar);
  }

  // Cierra el modal
  // ejecuta la funcion pendiente (aceptar/confirmar)
  cerrar() {
    // Guardo la funcion y la borro ANTES de ejecutarla
    // si ella abre otro modal, no se pisa
    const pendiente = this.alCerrar;
    this.alCerrar = undefined;
    // update = cambia el signal a partir de su valor actual
    // copia todo y solo cambio a "abierto"
    this.estado.update((e) => ({ ...e, abierto: false }));
    pendiente?.();
  }

  // Cierra sin ejecutar nada (boton Cancelar)
  cancelar() {
    this.alCerrar = undefined;
    this.estado.update((e) => ({ ...e, abierto: false }));
  }

  // Metodo para arma el estado 
  //(se usa para mostrar y confirmar)
  private abrir(tipo: TipoModal, titulo: string, mensajes: string | string[], confirmacion: boolean, alCerrar?: () => void) {
    this.alCerrar = alCerrar;
    this.estado.set({
      abierto: true,
      tipo,
      titulo,
      // Si ya es una lista la dejo; si es un solo texto lo meto en una lista
      mensajes: Array.isArray(mensajes) ? mensajes : [mensajes],
      confirmacion,
    });
  }
}