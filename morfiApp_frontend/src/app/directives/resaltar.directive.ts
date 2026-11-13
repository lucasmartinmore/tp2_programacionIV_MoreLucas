import { Directive, ElementRef, input, inject } from '@angular/core';

// Se usa como atributo: <tr appResaltar> o <tr appResaltar="#ffe8cc">
@Directive({
  selector: '[appResaltar]',
  // host = eventos del elemento donde se pone la directiva
  host: { '(mouseenter)': 'poner()', '(mouseleave)': 'sacar()' },
})
export class ResaltarDirective {
  // El color llega por el mismo atributo (alias);
  //  por defecto un naranja claro
  color = input('#fff0e0', { alias: 'appResaltar' });
  // ElementRef = el elemento HTML real donde está la directiva
  private el = inject<ElementRef<HTMLElement>>(ElementRef);

  poner() {
    const color = this.color() || '#fff0e0';
    this.el.nativeElement.style.backgroundColor = color;
    // Las celdas de las tablas de Bootstrap pintan su propio fondo
    //  con esta variable: se la cambiamos para que el color se vea
    this.el.nativeElement.style.setProperty('--bs-table-bg', color);
  }

  sacar() {
    this.el.nativeElement.style.backgroundColor = '';
    this.el.nativeElement.style.removeProperty('--bs-table-bg');
  }
}