import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Schema as MongooseSchema, Types } from 'mongoose';

// timestamps: true agrega createdAt (fecha del comentario) y updatedAt
@Schema({ timestamps: true })
export class Comentario {
  // a que publi pertenes (referencia a otra coleccion)
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Publicacion', required: true, index: true })
  publicacion: Types.ObjectId;

  // Quien lo escribio
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Usuario', required: true })
  usuario: Types.ObjectId;

  @Prop({ required: true, trim: true, maxlength: 500 })
  mensaje: string;

  // false al crear
  // pasa a true cuando se edita 
  @Prop({ default: false })
  modificado: boolean;
}

// Mongoose genera el esquema a partir de la clase
export const ComentarioSchema = SchemaFactory.createForClass(Comentario);
// indice compuesto: lo mas nuevos primeros (la consulta que mas usamos)
ComentarioSchema.index({ publicacion: 1, createdAt: -1 });