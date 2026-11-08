import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import type { RequestConUsuario } from './auth.types.js';

// Segundo guard: se usa despues de AuthGuard
// AuthGuard comprueba que el token sea valido y deja
// request.user; este comprueba que el rol sea de administrador
@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RequestConUsuario>();
    if (request.user?.perfil !== 'administrador') {
      // 403: no tenes los permisos
      throw new ForbiddenException('Esta acción es solo para administradores');
    }
    return true;
  }
}