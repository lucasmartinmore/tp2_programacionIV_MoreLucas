import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Schema as MongooseSchema, Types } from 'mongoose';

// timestamps: true -> Mongo agrega solo "createdAt" y "updatedAt" (la fecha de creacion que sirve para ordenar)
@Schema({ timestamps: true })
// publicacion guardada en la colección "publicaciones"
export class Publicacion {
  // Guardo el ID del usuario una ref
  // ref: 'Usuario' le dice a Mongoose a que colección apunta, y permite traer los datos con populate()
  // index: true crea un indice: buscar "las publicaciones de este usuario" es mas rapido
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Usuario', required: true, index: true })
  usuario: Types.ObjectId;

  @Prop({ required: true, trim: true, maxlength: 100 })
  titulo: string;

  // Mensaje (el cuerpo de la publicacion la descipcion)
  @Prop({ required: true, trim: true, maxlength: 1000 })
  mensaje: string;

  // URL de la imagen en Cloudinary, o null si no tiene (la imagen es opcional)
  @Prop({ type: String, default: null })
  imagenUrl: string | null;

  // Lista de IDs de los usuarios que dieron me gusta. Sirve para saber si alguien ya le dio, es uno solo por usu
  @Prop({ type: [{ type: MongooseSchema.Types.ObjectId, ref: 'Usuario' }], default: [] })
  meGusta: Types.ObjectId[];

  // Contador de me gusta
  @Prop({ default: 0 })
  cantidadMeGusta: number;

  // Baja logica: lo marcamos como inactivo (false). Asi no se pierde el dato
  // El listado solo trae las que tienen activa: true
  @Prop({ default: true, index: true })
  activa: boolean;
}

// Convierte la clase en un schema real de Mongoose.
export const PublicacionSchema = SchemaFactory.createForClass(Publicacion);

// Índices compuestos: aceleran justo las dos consultas del listado (por fecha y por me gusta, solo activas)
PublicacionSchema.index({ activa: 1, createdAt: -1 });
PublicacionSchema.index({ activa: 1, cantidadMeGusta: -1, createdAt: -1 });