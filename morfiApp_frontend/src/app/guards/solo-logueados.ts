import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';// CanActivateFn = tipo de un guard de rutas funcional
import { Auth } from '../servicios/auth';

// Deja entrar a la ruta solo si hay token; si no, redirige al login
export const soloLogueados: CanActivateFn = () => {
  const auth = inject(Auth);
  const router = inject(Router);
  // createUrlTree = "devolve esta dire" 
  return auth.token() ? true : router.createUrlTree(['/login']);
};