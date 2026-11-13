import { ConflictException, Injectable, BadRequestException, NotFoundException } from '@nestjs/common';// ConflictException: error que Nest convierte en respuesta 409 ("el recurso ya existe")
import { InjectModel } from '@nestjs/mongoose';// InjectModel: pide a Nest el "modelo" de Mongoose (la herramienta para buscar y guardar en una colección).
import { Model, isValidObjectId  } from 'mongoose';
import { Usuario } from './entities/usuario.entity.js';
import { PasswordHasher } from '@nestjs/authentication';
import { CreateUsuarioDto } from './dto/create-usuario.dto.js';// CreateUsuarioDto: la forma de los datos para crear un usuario.
import { CrearUsuarioAdminDto } from './dto/create-usuario-admin.dto.js'; 
import { UpdatePerfilDto } from './dto/update-perfil.dto.js'; 
import { ImagenesService } from '../imagenes/imagenes.service.js'; 


@Injectable()
export class UsuariosService {
  constructor(
    // @InjectModel(Usuario.name): Pide el modelo de la colección Usuario
    @InjectModel(Usuario.name) private readonly usuarioModel: Model<Usuario>,
    private readonly imagenesService: ImagenesService, // para subir fotos
    private readonly passwordHasher: PasswordHasher, // para hashear la contraseña del usuario creado por el admin
  ) {}

  // Revisa que el correo y el nombre de usuario estan libres
  async verificarDisponibilidad(email: string, username: string) {
    // findOne busca UN documento. $or significa "esta condición O esta otra".
    const existente = await this.usuarioModel
      .findOne({ $or: [{ email: email.toLowerCase() }, { username }] })
      // exec() ejecuta la consulta y devuelve el resultado (o null si no hay nadie).
      .exec();

    // Si encontro a alguien, ya esta ocupado.
    if (existente) {
      const campo = existente.email === email.toLowerCase() ? 'correo' : 'nombre de usuario';
      // "throw" lanza un error. Nest lo atrapa solo y responde 409 .
      throw new ConflictException(`Ya existe un usuario con ese ${campo}`);
    }
  }
  // Guarda el usuario. Recibe los datos del DTO pero con la contraseña ya hasheada, y la URL de la foto.
  async create(dto: CreateUsuarioDto & { password: string }, imagenPerfilUrl: string | null) {
    try {
      // create() guarda un documento nuevo en Mongo y devuelve lo guardado
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

  // listado completo para el administrador (sin contraseña)
  async listar() {
    return this.usuarioModel.find().sort({ createdAt: -1 }).select('-password -__v').lean().exec();
  }

  // El administrador crea un usuario (con el perfil que elija)
  async crearDesdeAdmin(dto: CrearUsuarioAdminDto, imagen?: Express.Multer.File) {
    await this.verificarDisponibilidad(dto.email, dto.username);
    const imagenUrl = imagen ? await this.imagenesService.subir(imagen) : null;// Si mando foto, la subimos a Cloudinary; si no, null
    const password = await this.passwordHasher.hash(dto.password);  // Hasheamos la contraseña: nunca se guarda en texto
    const usuario = await this.create({ ...dto, password }, imagenUrl);  // "perfil" viaja dentro de dto, asi que se guarda
    return this.sinPassword(usuario);
  }

  // Habilitar (activo=true) 
  // deshabilitar (activo=false)
  async cambiarEstado(id: string, activo: boolean, solicitanteId: string) {
    // Un admin no puede deshabilitarse a si mismo 
    if (!activo && id === solicitanteId) {
      throw new BadRequestException('No podés deshabilitar tu propia cuenta');
    }
    if (!isValidObjectId(id)) throw new NotFoundException('Usuario no encontrado');
    const usuario = await this.usuarioModel.findByIdAndUpdate(id, { activo }, { new: true }).exec();// new:true = devolveme el documento ya actualizado
    if (!usuario) throw new NotFoundException('Usuario no encontrado');
    return this.sinPassword(usuario);
  }

    // El administrador cambia el perfil de otro usuario (usuario - administrador)
  async cambiarPerfil(id: string, perfil: 'usuario' | 'administrador', solicitanteId: string) {
    // No puede cambiarse el perfil a síi mismo:
    // asi nunca se queda el sistema sin administradores
    if (id === solicitanteId) {
      throw new BadRequestException('No podés cambiar tu propio perfil');
    }
    if (!isValidObjectId(id)) throw new NotFoundException('Usuario no encontrado');
    const usuario = await this.usuarioModel.findByIdAndUpdate(id, { perfil }, { new: true }).exec();
    if (!usuario) throw new NotFoundException('Usuario no encontrado');
    return this.sinPassword(usuario);
  }

  // El usuario modifica SU perfil (nombre, apellido, descripcion, fecha y foto)
  async actualizarPerfil(id: string, dto: UpdatePerfilDto, imagen?: Express.Multer.File) {
    // Armo solo con lo que vino 
    // (undefined = no se toca)
    const cambios: Record<string, any> = {};
    for (const campo of ['nombre', 'apellido', 'descripcion', 'fechaNacimiento'] as const) {
      if (dto[campo] !== undefined) cambios[campo] = dto[campo];
    }
    // Si subio una foto nueva, la subo y guardo la nueva URL
    if (imagen) cambios.imagenPerfilUrl = await this.imagenesService.subir(imagen);
    const usuario = await this.usuarioModel.findByIdAndUpdate(id, { $set: cambios }, { new: true }).exec();
    if (!usuario) throw new NotFoundException('Usuario no encontrado');
    return this.sinPassword(usuario);
  }

  // Saca contraseña y __v antes de devolver un usuario
  private sinPassword(usuario: { toObject: () => Record<string, any> }) {
    const { password, __v, ...resto } = usuario.toObject();
    return resto;
  }
}