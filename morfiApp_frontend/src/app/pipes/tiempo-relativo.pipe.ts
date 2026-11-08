import { Pipe, PipeTransform } from '@angular/core';

// Un pipe transforma un valor para mostrarlo
// {{ fecha | tiempoRelativo }}
@Pipe({ name: 'tiempoRelativo' })
export class TiempoRelativoPipe implements PipeTransform {
  transform(valor: string | Date | null | undefined): string {
    if (!valor) return '';
    // Segundos que pasaron desde esa fecha hasta ahora
    const segundos = Math.floor((Date.now() - new Date(valor).getTime()) / 1000);
    if (segundos < 60) return 'hace un momento';
    const minutos = Math.floor(segundos / 60);
    if (minutos < 60) return `hace ${minutos} ${minutos === 1 ? 'minuto' : 'minutos'}`;
    const horas = Math.floor(minutos / 60);
    if (horas < 24) return `hace ${horas} ${horas === 1 ? 'hora' : 'horas'}`;
    const dias = Math.floor(horas / 24);
    if (dias < 30) return `hace ${dias} ${dias === 1 ? 'día' : 'días'}`;
    // Pasado un mes muestro la fecha completa
    return new Date(valor).toLocaleDateString('es-AR');
  }
}