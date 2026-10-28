/**
 * Lista de rutas: qué pantalla (componente) se muestra para cada dirección (URL).
 * Lo recibe provideRouter (app.config.ts); el <router-outlet> de app.html dibuja la pantalla.
 * - ¿Qué es loadComponent? Lazy loading ("carga perezosa"): el código de cada pantalla se descarga recién
 *   cuando el usuario entra a esa ruta, así la app inicial carga más rápido.
 * - ¿Por qué no hay guards? El Sprint 1 pide "navegación sin limites de accesibilidad"; se agregan con el JWT.
 */
import { Routes } from '@angular/router';
export const routes: Routes = [ 
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', loadComponent: () => import('./componentes/login/login').then((m) => m.Login) },
  { path: 'registro', loadComponent: () => import('./componentes/registro/registro').then((m) => m.Registro) },
  { path: 'publicaciones',loadComponent: () => import('./componentes/publicaciones/publicaciones').then((m) => m.Publicaciones),
  },
  // Muestra los datos del usuario logueado
  { path: 'mi-perfil', loadComponent: () => import('./componentes/mi-perfil/mi-perfil').then((m) => m.MiPerfil) },
  { path: '**', redirectTo: 'login' },
];