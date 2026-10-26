// Prop: Marca una propiedad como "columna" del documento en Mongo.
// Schema: Marca una clase como "forma de un documento".
// SchemaFactory: Convierte la clase en un schema real de Mongoose.
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export type Perfil = 'usuario' | 'administrador';

// Marca la clase como schema. timestamps: true -> Mongo agrega solo "createdAt" y "updatedAt" (fechas de creación y edición).
@Schema({ timestamps: true })
export class Usuario { // Describe cómo es un usuario guardado en la colección "usuarios"
  @Prop({ required: true, trim: true })
  // Nombre del usuario
  nombre: string;

  @Prop({ required: true, trim: true })
  // Apellido del usuario
  apellido: string;

  // unique: Nuede haber dos usuarios con el mismo valor (Mongo crea un índice único).
  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  // Correo electrónico del usuario
  email: string;

  @Prop({ required: true, unique: true, trim: true })
  // Nombre de usuario
  username: string;

  // Se guarda el HASH de la contraseña (un texto ilegible), nunca la contraseña real.
  @Prop({ required: true })
  // Contraseña ya hasheada
  password: string;

  @Prop({ required: true })
  // Fecha de nacimiento del usuario (Mongo la guarda como fecha).
  fechaNacimiento: Date;

  // default: '' -> si no la envían, queda como texto vacío.
  @Prop({ default: '' })
  // Descripción breve de la persona.
  descripcion: string;

  // default: null -> si no subió foto, queda sin valor.
  @Prop({ type: String, default: null })
  // Dirección web (URL) de la foto de perfil, o null si no tiene.
  imagenPerfilUrl: string | null;

  // default: 'usuario' -> todos se crean como usuarios comunes
  @Prop({ enum: ['usuario', 'administrador'], default: 'usuario' })
  // Perfil de la persona: usuario o administrador.
  perfil: Perfil;

  // En vez de borrar un usuario, se lo desactiva poniendo false (baja lógica).
  @Prop({ default: true })
  // Indica si el usuario está habilitado.
  activo: boolean;
}
export const UsuarioSchema = SchemaFactory.createForClass(Usuario);