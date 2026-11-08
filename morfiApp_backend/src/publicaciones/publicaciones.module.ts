import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PublicacionesController } from './publicaciones.controller.js';
import { PublicacionesService } from './publicaciones.service.js';
import { Publicacion, PublicacionSchema } from './entities/publicacion.entity.js';
import { ComentariosController } from './comentarios.controller.js';
import { ComentariosService } from './comentarios.service.js';
import { Comentario, ComentarioSchema } from '../usuarios/entities/comentario.entity.js';
// Los módulos de los que dependo: de ellos uso UsuariosService e ImagenesService
import { UsuariosModule } from '../usuarios/usuarios.module.js';
import { ImagenesModule } from '../imagenes/imagenes.module.js';
import { EstadisticasController } from './estadisticas.controller.js';
import { EstadisticasService } from './estadisticas.service.js';

@Module({
  imports: [
    // Registra el schema para poder pedir el modelo con @InjectModel
    MongooseModule.forFeature([
      { name: Publicacion.name, schema: PublicacionSchema },
      { name: Comentario.name, schema: ComentarioSchema }]),   // ← NUEVA línea
    UsuariosModule,
    ImagenesModule,
  ],
  // La clase que atiende las rutas /publicaciones
  controllers: [PublicacionesController, ComentariosController, EstadisticasController],
  // El service 
  providers: [PublicacionesService, ComentariosService, EstadisticasService],
  // exporto para utilizar comentarios
  exports: [PublicacionesService],
})
export class PublicacionesModule {}