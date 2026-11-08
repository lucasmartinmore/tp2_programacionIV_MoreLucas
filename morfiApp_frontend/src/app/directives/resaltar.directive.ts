import { Directive, ElementRef, input, inject } from '@angular/core';

// Se usa como atributo: <tr appResaltar> o <tr appResaltar="#ffe8cc">
@Directive({
  selector: '[appResaltar]',
  // host = eventos del elemento donde se pone la directiva
  host: { '(mouseenter)': 'poner()', '(mouseleave)': 'sacar()' },
})
export class ResaltarDirective {
  // El color llega por atributo (alias)
  color = input('#fff0e0', { alias: 'appResaltar' });
  // ElementRef = el elemento HTML real donde está la directiva
  private el = inject<ElementRef<HTMLElement>>(ElementRef);

  poner() {
    this.el.nativeElement.style.backgroundColor = this.color() || '#fff0e0';
  }

  sacar() {
    this.el.nativeElement.style.backgroundColor = '';
  }
}