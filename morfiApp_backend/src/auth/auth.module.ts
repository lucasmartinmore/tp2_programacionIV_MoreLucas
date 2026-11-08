import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';// nos da JwtService (firmar y verificar tokens)
import { AuthService } from './auth.service.js';
import { AuthController } from './auth.controller.js';
// Los modulos que necesita auth 
import { UsuariosModule } from '../usuarios/usuarios.module.js';
import { ImagenesModule } from '../imagenes/imagenes.module.js';
import { AuthGuard } from './auth.guard.js';

@Module({
  imports: [
    UsuariosModule,
    ImagenesModule,
    // registerAsync = configurar JWT despues de que Nest cargo el .env (con "register")
    JwtModule.registerAsync({
      // JwtService queda disponible en todos los modulos sin importarlo (lo necesita el guard)
      global: true,
      // funcion que devuelve la configuracion; se ejecuta al arrancar
      useFactory: () => ({
        secret: process.env.JWT_SECRET,
        // El token vence al minuto
        signOptions: { expiresIn: '1m' },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, AuthGuard],// AuthGuard como provider para poder inyectarlo
  exports: [AuthGuard],
})
export class AuthModule {}