/**
 * Lista de rutas: qué pantalla (componente) se muestra para cada dirección (URL).
 * Lo recibe provideRouter (app.config.ts); el <router-outlet> de app.html dibuja la pantalla.
 * - ¿Qué es loadComponent? Lazy loading ("carga perezosa"): el código de cada pantalla se descarga recién
 *   cuando el usuario entra a esa ruta, así la app inicial carga más rápido.
 * - ¿Por qué no hay guards? El Sprint 1 pide "navegación sin limites de accesibilidad"; se agregan con el JWT.
 */
import { Routes } from '@angular/router';
import { soloLogueados } from './guards/solo-logueados';
import { soloAdmin } from './guards/solo-admin';

export const routes: Routes = [
  // La raíz ahora muestra la pantalla "cargando", que valida el token y redirige
  { path: '', pathMatch: 'full', loadComponent: () => import('./componentes/cargando/cargando').then((m) => m.Cargando) },
  { path: 'login', loadComponent: () => import('./componentes/login/login').then((m) => m.Login) },
  { path: 'registro', loadComponent: () => import('./componentes/registro/registro').then((m) => m.Registro) },
  // canActivate = el guard corre antes de entrar; sin token → login
  { path: 'publicaciones', canActivate: [soloLogueados], loadComponent: () => import('./componentes/publicaciones/publicaciones').then((m) => m.Publicaciones) },
  // Detalle de una publicación; ":id" es un param variable de la URL
  { path: 'publicaciones/:id', canActivate: [soloLogueados], loadComponent: () => import('./componentes/publicacion/publicacion').then((m) => m.PublicacionDetalle) },
  { path: 'mi-perfil', canActivate: [soloLogueados], loadComponent: () => import('./componentes/mi-perfil/mi-perfil').then((m) => m.MiPerfil) },
  // Editar mi perfil
  { path: 'mi-perfil/editar', canActivate: [soloLogueados], loadComponent: () => import('./componentes/editar-perfil/editar-perfil').then((m) => m.EditarPerfil) },
  // Solo adminin: dos guards, primero hay que estar logueado y despues ser administrador
  { path: 'dashboard/usuarios', canActivate: [soloLogueados, soloAdmin], loadComponent: () => import('./componentes/dashboard-usuarios/dashboard-usuarios').then((m) => m.DashboardUsuarios) },
  { path: 'dashboard/estadisticas', canActivate: [soloLogueados, soloAdmin], loadComponent: () => import('./componentes/dashboard-estadisticas/dashboard-estadisticas').then((m) => m.DashboardEstadisticas) },
  // Cualquier otra dire → raiz (cargando decide)
  { path: '**', redirectTo: '' },
];