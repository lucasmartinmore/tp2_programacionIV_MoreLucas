import { Module } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { AuthController } from './auth.controller.js';
// Los módulos de los que dependemos: de ellos usamos UsuariosService e ImagenesService
import { UsuariosModule } from '../usuarios/usuarios.module.js';
import { ImagenesModule } from '../imagenes/imagenes.module.js';

@Module({
  
  imports: [UsuariosModule, ImagenesModule],// Importar un módulo nos da acceso a los services que ESE módulo exporta
  controllers: [AuthController],// La clase que atiende las rutas /auth/...
  providers: [AuthService],// El service de este módulo (PasswordHasher no se declara acá: ya lo deja disponible AuthenticationModule en el AppModule.)
})
export class AuthModule {}