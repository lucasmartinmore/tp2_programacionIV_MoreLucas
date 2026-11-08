/**
 * Configuración global de Angular (qué "herramientas" se activan en toda la app)
 * Aca se registran los "providers" (cosas que Angular debe preparar antes de arrancar)
 * Lo lee main.ts 
 *
 * - ¿Para qué sirve provideHttpClient()? Activa HttpClient; sin eso da "No provider for HttpClient".
 * - ¿Y provideRouter(routes)? Activa la navegación entre pantallas con la lista de app.routes.ts.
 * - ¿Qué es un provider? Una "receta" que le dice a Angular cómo crear algo para entregarlo cuando se pida.
 */
import { ApplicationConfig, provideBrowserGlobalErrorListeners, isDevMode } from '@angular/core';
import { provideRouter } from '@angular/router';// función que activa el router (el sistema de navegación entre pantallas)
import { provideHttpClient, withInterceptors  } from '@angular/common/http';// provideHttpClient = función que activa HttpClient (la herramienta para hablar con el back
import { routes } from './app.routes';
import { authInterceptor } from './interceptors/auth.interceptor';
import { provideServiceWorker } from '@angular/service-worker';


export const appConfig: ApplicationConfig = {
  
  providers: [// herramientas que Angular tiene que preparar al arrancar
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])), provideServiceWorker('ngsw-worker.js', {
            enabled: !isDevMode(),
            registrationStrategy: 'registerWhenStable:30000'
          }), // registra el interceptor para TODAS las peticiones
  ],
};