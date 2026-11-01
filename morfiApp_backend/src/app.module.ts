import { Module } from '@nestjs/common';// Convierte una clase en un módulo (una "caja" que agrupa piezas).
import { MongooseModule } from '@nestjs/mongoose';// Conecta Nest con MongoDB (usando la librería Mongoose).
import { ConfigModule } from '@nestjs/config';// Lee el archivo .env (donde guardamos datos sensibles).
import { AuthenticationModule } from '@nestjs/authentication';// Nos da la herramienta PasswordHasher (hash de contraseñas).
import { UsuariosModule } from './usuarios/usuarios.module.js';
import { AuthModule } from './auth/auth.module.js';
import { ImagenesModule } from './imagenes/imagenes.module.js';
import { PublicacionesModule } from './publicaciones/publicaciones.module.js';

@Module({
  // Lista de módulos que forman parte de la aplicación.
  imports: [
    ConfigModule.forRoot(),// Lee el .env y deja sus valores en process.env.
    AuthenticationModule.forRoot({// Configura el paquete de autenticación (deja disponible PasswordHasher en toda la app).
      globalGuard: false,// Por defecto este paquete bloquearía TODAS las rutas. Con false las dejamos libres
      session: {},
    }),
    // Conecta con MongoDB. process.env.MONGO_URI es la cadena de conexión del .env.
    MongooseModule.forRoot(process.env.MONGO_URI!),
    // Los módulos propios (si uno no está en esta lista, Nest lo ignora: "lo que no cuelga del AppModule no existe").
    UsuariosModule,
    AuthModule,
    ImagenesModule,
    PublicacionesModule,
  ],
})
export class AppModule {}