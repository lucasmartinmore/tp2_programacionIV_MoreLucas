// Reutilizamos AutorResumen que ya defino para las publi
import { AutorResumen } from './publicacion';

// comentario tal como lo devuelve el back
export interface Comentario {
  _id: string; // id de Mongo
  usuario: AutorResumen; // quien lo mando
  mensaje: string; 
  modificado: boolean; // true = fue editado y muestro "editado"
  createdAt: string; // fecha (viaja como texto en JSON)
}

// La respuesta paginada del GET de comentarios
export interface PaginaComentarios {
  items: Comentario[]; // los de esta tanda
  total: number; // cuantos hay en total (para saber si hay mas)
  offset: number;
  limit: number;
}