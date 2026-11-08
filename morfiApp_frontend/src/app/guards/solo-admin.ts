import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth } from '../servicios/auth';

// Deja entrar solo si el usuario logueado es administrador; si no, lo manda a publicaciones
export const soloAdmin: CanActivateFn = () => {
  const auth = inject(Auth);
  const router = inject(Router);
  return auth.usuario()?.perfil === 'administrador' ? true : router.createUrlTree(['/publicaciones']);
};