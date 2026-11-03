/**
 * Describen como llegan los datos de publicaciones desde el back.
 * "usuario" es un objeto y no un id porque el back usa populate: reemplaza el id del
 * autor por sus datos (nombre, username, foto), así no hay que pedirlos aparte para cada publi
 */

export interface AutorResumen {
  _id: string;// Id del usuario en Mongo.
  nombre: string;
  apellido: string;
  username: string;
  imagenPerfilUrl: string | null;// Foto de perfil (URL) o null si no tiene
}

export interface Publicacion {
  _id: string;// Id de la publi
  usuario: AutorResumen;// quien escribio
  titulo: string;
  mensaje: string;
  imagenUrl: string | null;// URL de la imagen (Cloudinary) o null si no tiene
  meGusta: string[];// Ids de los usuarios que dieron me gusta
  cantidadMeGusta: number;// Cantidad de me gusta
  createdAt: string;// Fecha de creacion (se formatea con el pipe date)
}

// Lo que devuelve GET /publicaciones, una pagina de resultados 
export interface PaginaPublicaciones {
  items: Publicacion[];// Las publicaciones de esta pagina
  total: number;// Cuantas hay en total (pag)
  offset: number;
  limit: number;
}

// Lo que devuelve dar o quitar un mg
export interface ResumenMeGusta {
  cantidadMeGusta: number;
  meGusta: string[];
}

// Los dos ordenes posibles del listado (tipo propio: solo acepta estas dos palabras)
export type Orden = 'fecha' | 'meGusta';