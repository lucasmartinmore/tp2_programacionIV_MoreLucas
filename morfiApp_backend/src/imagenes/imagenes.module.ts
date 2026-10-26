// Module: declara un módulo. MongooseModule: para registrar el schema.
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ImagenesService } from './imagenes.service';
import { ImagenesController } from './imagenes.controller';
import { Imagen, ImagenSchema } from './entities/imagen.entity';

@Module({
  // Registra el schema de Imagen para poder pedir su modelo.
  imports: [MongooseModule.forFeature([{ name: Imagen.name, schema: ImagenSchema }])],
  // Las clases que atienden rutas (acá, GET /imagenes/:id).
  controllers: [ImagenesController],
  // Los services del módulo.
  providers: [ImagenesService],
  // Presta el service a otros módulos: Auth lo usa para la foto de perfil
  // Sprint 2: Publicaciones para las fotos de recetas.
  exports: [ImagenesService],
})
export class ImagenesModule {}