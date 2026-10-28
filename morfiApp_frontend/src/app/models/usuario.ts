/**
 * Es una "interface" de TypeScript (describe como es un usuario: campos y tipos)
 * Existe SOLO mientras programo, no genera codigo en el navegador
 * La usan Auth (qué devuelve el back) y MiPerfil (mostrar los datos)
 *
 * - ¿Por qué no hay password? El back nunca la devuelve (guarda solo el hash).
 * - ¿De dónde sale _id? Lo genera MongoDB al guardar.
 */
export interface Usuario {
  // Identificador único que crea MongoDB (texto)
  _id: string;
  nombre: string;
  apellido: string;
  email: string;//unico en la db
  username: string;//unico en la db
  fechaNacimiento: string; // Llega como texto
  descripcion: string;// no es obligatorio
  imagenPerfilUrl: string | null;// URL de la foto, o null si no subió ninguna ("string | null" = texto o nada)
  perfil: 'usuario' | 'administrador';
  activo: boolean; // true = habilitado; false = deshabilitado 
}