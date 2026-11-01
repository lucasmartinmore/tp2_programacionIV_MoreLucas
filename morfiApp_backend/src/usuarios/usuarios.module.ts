import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsuariosService } from './usuarios.service';// El service de usuarios 
import { Usuario, UsuarioSchema } from './entities/usuario.entity';// La clase Usuario (para su nombre) y su schema

@Module({
  // forFeature registra el schema para poder pedir el modelo con @InjectModel.
  imports: [MongooseModule.forFeature([{ name: Usuario.name, schema: UsuarioSchema }])],
  providers: [UsuariosService],
  exports: [UsuariosService],
})
// Clase vacía: la configuración está en el decorador. No hay controller porque todavía no hay rutas de usuarios.
export class UsuariosModule {}