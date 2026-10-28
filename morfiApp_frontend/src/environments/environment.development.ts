/**
 * Guarda la dirección (URL) donde corre tu back de Nest
 * Lo lee el servicio Auth (servicios/auth.ts) para saber a dónde mandar las peticiones.
 * Guarda datos que cambian segun donde corre la app (tu compu o producción).
 *
 */

// export = visible para otros archivos; const environment = objeto con la configuración
export const environment = {
  apiUrl: 'http://localhost:3000',
};