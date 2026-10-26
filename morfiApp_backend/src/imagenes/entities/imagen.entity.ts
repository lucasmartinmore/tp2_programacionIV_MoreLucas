//Prop (propiedad), Schema (clase de documento), SchemaFactory (fábrica del schema).
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

//timestamps: true agrega las fechas de creación y edición.
// ¿Por qué en Mongo y no en una carpeta? Porque Vercel no deja guardar archivos en disco, y la base de datos sí persiste.
@Schema({ timestamps: true })
export class Imagen {
  // Los bytes de la imagen. Buffer es la forma en que Node representa datos binarios (un archivo en memoria).
  @Prop({ required: true, type: Buffer })
  // Contenido de la imagen.
  datos: Buffer;

  // El tipo de archivo ("image/png", "image/jpeg", "image/webp"). Hace falta para devolverla bien después.
  @Prop({ required: true })
  // Tipo de contenido (mimetype).
  tipo: string;
}

// Convierte la clase en schema de Mongoose.
export const ImagenSchema = SchemaFactory.createForClass(Imagen);