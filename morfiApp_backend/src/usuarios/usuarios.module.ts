import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsuariosService } from './usuarios.service';// El service de usuarios (la lógica)
import { Usuario, UsuarioSchema } from './entities/usuario.entity';// La clase Usuario (para su nombre) y su schema (la forma real en Mongo)

@Module({
  // forFeature registra el schema para poder pedir el modelo con @InjectModel.
  imports: [MongooseModule.forFeature([{ name: Usuario.name, schema: UsuarioSchema }])],
  // providers: los services de este módulo (sin esto, Nest no sabría que existen).
  providers: [UsuariosService],
  // exports: los services que este módulo "presta" a otros módulos. AuthModule necesita UsuariosService.
  // Si faltara, aparecería el error "Nest can't resolve dependencies of the AuthService".
  exports: [UsuariosService],
})
// Clase vacía: la configuración está en el decorador. No hay controller porque todavía no hay rutas de usuarios.
export class UsuariosModule {}