import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'recortar' })
export class RecortarPipe implements PipeTransform {
  // {{ texto | recortar: 120 }}: el 120 llega como "maximo" (si no se pasa, vale 100)
  transform(texto: string | null | undefined, maximo = 100): string {
    if (!texto) return '';
    // Si entra completo, se deja igual
    if (texto.length <= maximo) return texto;
    // Corto, saco los espacios del final y agrego los puntos suspensivos
    return texto.slice(0, maximo).trimEnd() + '...';
  }
}