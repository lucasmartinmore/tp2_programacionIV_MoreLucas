import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsuariosService } from './usuarios.service.js';
import { UsuariosController } from './usuarios.controller.js'; // NUEVO
import { Usuario, UsuarioSchema } from './entities/usuario.entity.js';
import { ImagenesModule } from '../imagenes/imagenes.module.js'; 

@Module({
  // ImagenesModule: el service ahora sube fotos
  imports: [MongooseModule.forFeature([{ name: Usuario.name, schema: UsuarioSchema }]), ImagenesModule],
  controllers: [UsuariosController], // Este modul tiene rutas
  providers: [UsuariosService],
  exports: [UsuariosService],
})
export class UsuariosModule {}