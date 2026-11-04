import { inject } from '@angular/core';
import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';// catchError atrapa el error; throwError lo vuelve a lanzar
import { environment } from '../../environments/environment';
import { Auth } from '../servicios/auth';
import { ModalService } from '../servicios/modal';

// Un interceptor es una funcion que ve TODAS las peticiones HTTP antes de salir 
// y todas las respuestas al volver
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(Auth);
  const router = inject(Router);
  const modal = inject(ModalService);
  const token = auth.token();

  // Si hay token y el pedido va al back, le agrego el header Authorization
  const peticion =
    token && req.url.startsWith(environment.apiUrl)
      ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
      : req;

  // Dejamos seguir la peticion
  //  y miro si vuelve con error
  return next(peticion).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401 && !req.url.endsWith('/auth/login')) {// 401 en cualquier ruta MENOS login
        // habia sesion? (para avisar solo en ese caso)
        const habiaSesion = auth.usuario() !== null;
        // Limpiamos todo y mando al login para rehacer el token 
        auth.logout();
        router.navigate(['/login']);
        if (habiaSesion) modal.mostrar('info', 'Sesión vencida', 'Volvé a iniciar sesión.');
      }
      // Relanzamos el error para que el componente que hizo el pedido tambien lo reciba
      return throwError(() => err);
    }),
  );
};