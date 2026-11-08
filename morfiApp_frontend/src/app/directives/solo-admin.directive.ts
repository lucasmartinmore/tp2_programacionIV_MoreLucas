import { Directive, TemplateRef, ViewContainerRef, effect, inject } from '@angular/core';
import { Auth } from '../servicios/auth';

// Se usa con asterisco: <a *appSoloAdmin> ...  
// El elemento solo existe si el usuario es administrador
@Directive({ selector: '[appSoloAdmin]' })
export class SoloAdminDirective {
  private auth = inject(Auth);
  // TemplateRef = el "molde" del elemento 
  private plantilla = inject(TemplateRef);
  // ViewContainerRef = el lugar del HTML donde se inserta o se saca ese molde
  private contenedor = inject(ViewContainerRef);

  constructor() {
    // effect se vuelve a ejecutar cuando cambia el usuario (por ejemplo, al loguearse o salir)
    effect(() => {
      // Primero vaciamos el lugar
      this.contenedor.clear();
      // Si es administrador, creo el elemento
      if (this.auth.usuario()?.perfil === 'administrador') {
        this.contenedor.createEmbeddedView(this.plantilla);
      }
    });
  }
}