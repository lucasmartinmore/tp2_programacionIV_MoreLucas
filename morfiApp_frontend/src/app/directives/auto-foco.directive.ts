import { Directive, ElementRef, OnInit, inject } from '@angular/core';

// Se usa como atributo: <textarea appAutoFoco> ... 
// apenas aparece, recibe el cursor
@Directive({ selector: '[appAutoFoco]' })
export class AutoFocoDirective implements OnInit {
  private el = inject<ElementRef<HTMLElement>>(ElementRef);

  ngOnInit() {
    // setTimeout: espero a que el elemento termine de dibujarse antes de enfocarlo
    setTimeout(() => this.el.nativeElement.focus());
  }
}