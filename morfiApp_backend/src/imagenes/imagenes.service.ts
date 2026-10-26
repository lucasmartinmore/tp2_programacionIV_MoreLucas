import { Injectable, NotFoundException } from '@nestjs/common';// Injectable: marca la clase como service. NotFoundException: error que Nest convierte en respuesta 404
import { InjectModel } from '@nestjs/mongoose';// InjectModel: pide el modelo de Mongoose a Nest
import { Model, isValidObjectId } from 'mongoose';// isValidObjectId: función que dice si un texto tiene forma de id de Mongo
import { Imagen } from './entities/imagen.entity';// La clase Imagen (su forma en Mongo)

// Service de imágenes: guarda y busca fotos.
@Injectable()
export class ImagenesService {
  // Inyección por constructor: Nest nos entrega el modelo de la colección Imagen.
  constructor(
    @InjectModel(Imagen.name) private readonly imagenModel: Model<Imagen>,
  ) {}

  // Devuelve una promesa de texto: el id que Mongo le asigna.
  async guardar(archivo: Express.Multer.File): Promise<string> { // Express.Multer.File es el tipo del archivo que llega (trae nombre, tipo, tamaño y los bytes)
    const creada = await this.imagenModel.create({
      datos: archivo.buffer, // Los bytes (archivo.buffer)
      tipo: archivo.mimetype, //Tipo = por ej. "image/png".
    });
    return creada._id.toString(); // Mongo le asigna un _id unico
  }

  // Busca una imagen por su id
  async obtener(id: string) {
    if (!isValidObjectId(id)) {
      throw new NotFoundException('Imagen no encontrada en el sistema');
    }
    const imagen = await this.imagenModel.findById(id).exec();// findById busca por id. exec() ejecuta la consulta
    // Si no existe, devuelve null: respondemos 404.
    if (!imagen) {
      throw new NotFoundException('Imagen no encontrada en el sistema');
    }
    return imagen;
  }
}