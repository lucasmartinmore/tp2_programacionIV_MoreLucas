import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'iniciales' })
export class InicialesPipe implements PipeTransform {
  transform(nombreCompleto: string | null | undefined): string {
    if (!nombreCompleto) return '';
    return nombreCompleto
      .trim()
      .split(/\s+/) // separa por espacios
      .slice(0, 2) // max dos palabras
      .map((palabra) => palabra.charAt(0).toUpperCase()) // primera letra en Mayusc
      .join('');
  }
}