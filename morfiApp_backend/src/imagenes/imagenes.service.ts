import { Injectable, Logger, NotFoundException, ServiceUnavailableException } from '@nestjs/common'; // NUEVO: Logger y ServiceUnavailableException
import { InjectModel } from '@nestjs/mongoose';//InjectModel: pide el modelo de Mongoose a Nest
import { Model, isValidObjectId } from 'mongoose';// isValidObjectId: dice si un texto tiene forma de id de Mong
import cloudinaryPaquete from 'cloudinary';// La librería de Cloudinary (paquete completo); mas abajo saco la parte "v2", que es la que uso
import { Imagen } from './entities/imagen.entity.js';// La clase Imagen (su forma en Mongo, del Sprint 1)
// Tomamos la parte v2 (la que uso). Lo hago asi porque el back esta en formato ESM y cloudinary es un paquete CommonJS
const cloudinary = cloudinaryPaquete.v2;

// Service de imagenes: sube fotos a Cloudinary y (para las viejas) busca fotos guardadas en Mongo.
@Injectable()
export class ImagenesService {
  //Logger de Nest. Deja en la terminal el error REAL de Cloudinary 
  // aunque al usuario le mostremos un mensaje simple
  private readonly logger = new Logger(ImagenesService.name);

  // Inyección por constructor: Nest nos entrega el modelo de la coleccion Imagen
  constructor(
    @InjectModel(Imagen.name) private readonly imagenModel: Model<Imagen>,
  ) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  // Subo un archivo a Cloudinary y devuelvo su URL public (https://res.cloudinary.com/...)
  // Devuelve una Promise de texto
  subir(archivo: Express.Multer.File): Promise<string> {
    // upload_stream de Cloud usa "callbacks" (funciones de aviso), no promise
    // Por eso lo envolvemos en una Promise propia: resolve = salio bien, reject = salio mal
    return new Promise((resolve, reject) => {
      // upload_stream abre un canal por el que mandamos los bytes, folder = carpeta dentro de Cloudinary
      // NUEVO: timeout = cuanto espera (en milisegundos) antes de darse por vencido; por defecto eran 60 segundos, ahora 2 minutos para redes lentas
      const canal = cloudinary.uploader.upload_stream({ folder: 'MorfiAppImg', timeout: 120000 }, (error, resultado) => {
        if (error || !resultado) {
          // guardamos el error real en la terminal para poder diagnosticarlo
          this.logger.error(`Falló la subida a Cloudinary: ${error?.message ?? 'sin resultado'} (código ${error?.http_code ?? 'n/a'})`);
          // NUEVO: en vez de un 500 generico, respondemos 503 con un mensaje que el usuario entiende
          return reject(new ServiceUnavailableException('No pudimos subir la imagen. Revisá tu conexión e intentá de nuevo.'));
        }
        // secure_url = la dirección https de la imagen ya subida la guardo en la base
        resolve(resultado.secure_url);
      });
      // nunca escribo al disco, los bytes pasan de memoria a Cloudinary
      canal.end(archivo.buffer);
    });
  }

  // Funcion de mongo: Guarda un archivo en Mongo. Se mantiene para no romper las fotos que ya subi
  async guardar(archivo: Express.Multer.File): Promise<string> {
    // create() guarda un documento nuevo. datos = los bytes; tipo = por ej. "image/png".
    const creada = await this.imagenModel.create({
      datos: archivo.buffer,
      tipo: archivo.mimetype,
    });
    // Devolvemos el id que Mongo le asignó, convertido a texto
    return creada._id.toString();
  }

  // Funcion de mongo: Busca una imagen guardada en Mongo por su id
  async obtener(id: string) {
    // Si el texto no tiene forma de id de Mongo, respondemos 404 sin consultar
    if (!isValidObjectId(id)) {
      throw new NotFoundException('Imagen no encontrada');
    }
    // findById busca por id. exec() ejecuta la consulta
    const imagen = await this.imagenModel.findById(id).exec();
    // Si no existe, respondemos 404
    if (!imagen) {
      throw new NotFoundException('Imagen no encontrada');
    }
    // Devolvemos el documento encontrado
    return imagen;
  }
}