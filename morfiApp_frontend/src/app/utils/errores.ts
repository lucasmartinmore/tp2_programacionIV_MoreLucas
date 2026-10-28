/**
 * Traducen un error que viene del back a un texto para mostrar en el modal.
 * Las usan Registro y Login cuando la petición falla.
 * utils/: guarda funciones sueltas que sirven para varias pantallas.
 *
 * - ¿Qué significa status 0? Que la petición no llegó al servidor (back apagado, sin internet o CORS)
 * - ¿Cómo mostrás varios errores de validación? Nest devuelve message como lista; la mostramos entera.
 * - ¿Qué códigos manejás? 400 datos inválidos, 401 credenciales incorrectas, 409 dato repetido, 0 sin conexión.
 * - ¿Por qué una función aparte? Para no duplicar código en Login y Registro.
 */
import { HttpErrorResponse } from '@angular/common/http';//Objeto de error que Angular da cuando una petición HTTP falla

// El back responde { message: '...' } o { message: ['...', '...'] }
export function mensajesDeError(err: HttpErrorResponse): string[] {
  if (err.status === 0) return ['No se pudo conectar con el servidor. Probá de nuevo en un rato.'];
  const m = err.error?.message;//"?." evita romper si error viene vacío
  if (Array.isArray(m)) return m;// Si es una lista (varios mensajes, ej. validaciones) la devolvemos tal cual
  if (typeof m === 'string') return [m];// Si es un solo texto (ej "Credenciales incorrectas") lo ponemos dentro de una lista
  return ['Ocurrió un error inesperado.'];
}

// Devuelve el título del modal según el código de estado HTTP
export function tituloDeError(status: number): string {
  switch (status) {
    // 0 = el servidor no respondió
    case 0:
      return 'Sin conexión';
    // 400 = Bad Request: datos inválidos
    case 400:
      return 'Revisá los datos';
    // 401 = Unauthorized: credenciales incorrectas
    case 401:
      return 'No pudimos iniciar sesión';
    // 409 = Conflict: el dato ya existe (correo o usuario repetido)
    case 409:
      return 'Dato ya registrado';
    // default = cualquier otro código no contemplado
    default:
      return 'Ocurrió un error';
  }
}