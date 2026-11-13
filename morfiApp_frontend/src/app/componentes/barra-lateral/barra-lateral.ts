import { Component } from '@angular/core';

// Barra lateral con las reglas de la comunidad 
// y consejos para publicar (contenido fijo)
@Component({
  selector: 'app-barra-lateral',
  styleUrl: './barra-lateral.css',
  templateUrl: './barra-lateral.html',
})
export class BarraLateral {
  reglas = [
    { titulo: 'Respeto ante todo', texto: 'Sin insultos ni discriminación. Acá venimos a compartir recetas.' },
    { titulo: 'Recetas con crédito', texto: 'Si la receta no es tuya, nombrá a quien la inventó o de dónde la sacaste.' },
    { titulo: 'Título claro', texto: 'Que se entienda de qué plato se trata antes de abrir la publicación.' },
    { titulo: 'Fotos reales', texto: 'Subí fotos de tu plato: JPG, PNG o WEBP de hasta 2 MB.' },
  ];

  consejos = [
    'Lista los ingredientes con sus cantidades.',
    'Contá los pasos en orden y con los tiempos de cocción.',
    'Sumá tu truco personal!.',
  ];
}