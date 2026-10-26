import { ConflictException, Injectable } from '@nestjs/common';// ConflictException: error que Nest convierte en respuesta 409 ("el recurso ya existe")
import { InjectModel } from '@nestjs/mongoose';// InjectModel: pide a Nest el "modelo" de Mongoose (la herramienta para buscar y guardar en una colección).
import { Model } from 'mongoose';
import { Usuario } from './entities/usuario.entity';
import { CreateUsuarioDto } from './dto/create-usuario.dto';// CreateUsuarioDto: la forma de los datos para crear un usuario.

// Marca la clase como service
// Service guarda la logica
// Los controllers solo derivan hacia el.
@Injectable()
export class UsuariosService {
  constructor(
    // @InjectModel(Usuario.name): Pide el modelo de la colección Usuario
    @InjectModel(Usuario.name) private readonly usuarioModel: Model<Usuario>,
  ) {}

  // Revisa que el correo y el nombre de usuario estén libres
  async verificarDisponibilidad(email: string, username: string) {
    // findOne busca UN documento. $or significa "esta condición O esta otra".
    const existente = await this.usuarioModel
      .findOne({ $or: [{ email: email.toLowerCase() }, { username }] })
      // exec() ejecuta la consulta y devuelve el resultado (o null si no hay nadie).
      .exec();

    // Si encontro a alguien, ya esta ocupado.
    if (existente) {
      const campo = existente.email === email.toLowerCase() ? 'correo' : 'nombre de usuario';
      // "throw" lanza un error. Nest lo atrapa solo y responde 409 con este mensaje (no hace falta try/catch).
      throw new ConflictException(`Ya existe un usuario con ese ${campo}`);
    }
  }
  // Guarda el usuario. Recibe los datos del DTO pero con la contraseña ya hasheada, y la URL de la foto.
  async create(dto: CreateUsuarioDto & { password: string }, imagenPerfilUrl: string | null) {
    try {
      // create() guarda un documento nuevo en Mongo y devuelve lo guardado.
      // { ...dto, imagenPerfilUrl } copia todos los datos del dto y le suma la URL de la foto.
      return await this.usuarioModel.create({ ...dto, imagenPerfilUrl });
    } catch (error: any) {
      // Si dos personas se registran EXACTAMENTE al mismo tiempo con el mismo correo,
      if (error?.code === 11000) {// Mongo avisa con el código de error 11000 ("clave duplicada")
        throw new ConflictException('Ya existe un usuario con ese correo o nombre de usuario');
      }
      // Cualquier otro error se deja pasar tal cual
      throw error;
    }
  }

  // Busca un usuario por correo O por nombre de usuario (el login permite cualquiera de los dos).
  findByEmailOrUsername(identificador: string) {
    return this.usuarioModel
      .findOne({ $or: [{ email: identificador.toLowerCase() }, { username: identificador }] })
      .exec();
  }

  // Busca un usuario por su id de Mongo
  findById(id: string) {
    return this.usuarioModel.findById(id).exec();
  }
}