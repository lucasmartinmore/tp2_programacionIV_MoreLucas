import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { PayloadJwt, RequestConUsuario } from './auth.types.js';

@Injectable()
export class AuthGuard implements CanActivate {
  // Me entrega el JwtService (inject por constructor)
  constructor(private readonly jwtService: JwtService) {}

  // Nest la llama ANTES del controller
  // devuelve true pasa; si lanza error y corta con 401
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestConUsuario>();// Saco la petición HTTP del context
    const token = this.extraerToken(request);// Busco el token en el header Authorization
    // Sin token: 401 (no se quien sos)
    if (!token) throw new UnauthorizedException('Falta el token');
    try {
      // verifyAsync compruebo la firma y que no este vencido; devuelve el payload
      // Lo guardo en request.user para que el controller sepa
      request.user = await this.jwtService.verifyAsync<PayloadJwt>(token);
    } catch {
      throw new UnauthorizedException('Token inválido o vencido');// Firma mala, token alterado o vencido  
    }
    return true;
  }

  // El header viene como "Bearer eyJhbGci..."
  private extraerToken(request: RequestConUsuario): string | undefined {
    const [tipo, token] = request.headers.authorization?.split(' ') ?? [];
    // Solo acepto formato Bearer
    return tipo === 'Bearer' ? token : undefined;
  }
}