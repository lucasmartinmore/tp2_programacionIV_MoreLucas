// Excepciones de Nest: cada una se convierte en un código HTTP (409, 403, 404).
import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';// InjectModel: pide el modelo de Mongoose a Nest.
import { Model, Types, isValidObjectId } from 'mongoose';
// La clase Publicacion y los DTOs
import { Publicacion } from './entities/publicacion.entity.js';
import { CreatePublicacionDto } from './dto/create-prublicacion.dto.js';
import { ListarPublicacionesDto } from './dto/listar-publicaciones.dto.js';
// usuarios (para validar quien interactua)  imágenes (para subir la foto)
import { UsuariosService } from '../usuarios/usuarios.service.js';
import { ImagenesService } from '../imagenes/imagenes.service.js';

// Datos del user queremos traer junto a cada publicacion 
const CAMPOS_AUTOR = 'nombre apellido username imagenPerfilUrl';

// Service de publicaciones: logica
@Injectable()
export class PublicacionesService {
  // Pedimos al constructor lo que necesito
  constructor(
    @InjectModel(Publicacion.name) private readonly publicacionModel: Model<Publicacion>,// El modelo para leer y escribir en la colección de publi
    private readonly usuariosService: UsuariosService,// Para comprobar que el usuario exista
    private readonly imagenesService: ImagenesService,// Para subir la imagen a Cloudinary
  ) {}

  // El usuarioId llega del TOKEN, no del cliente
  async crear(dto: CreatePublicacionDto, usuarioId: string, imagen?: Express.Multer.File) {
    // validamos que el usuario exista y este activ
    await this.validarUsuario(usuarioId);

    let imagenUrl: string | null = null;
    // Si subio una imagen, la subimos a Cloudinary y nos devuelve la URL 
    if (imagen) {
      imagenUrl = await this.imagenesService.subir(imagen);
    }

    // Guardo la publi con el id del usuario que sale del token
    const creada = await this.publicacionModel.create({
      titulo: dto.titulo,
      mensaje: dto.mensaje,
      usuario: new Types.ObjectId(usuarioId),
      imagenUrl,
    });

    // La volvemos a leer con los datos del autor, para devolverla lista para mostrar
    // populate reemplaza el id del usuario por sus datos
    // lean() devuelve un objeto simple
    return this.publicacionModel.findById(creada._id).populate('usuario', CAMPOS_AUTOR).lean().exec();
  }

  // Trae una publi (para la pag de detalle)
  async obtener(id: string) {
    // buscarActiva lanza 404 si no existe o esta dado de baja
    await this.buscarActiva(id);
    return this.publicacionModel.findById(id).populate('usuario', CAMPOS_AUTOR).lean().exec();
  }

  // LISTADO: con orden, filtro por usuario y paginacion
  async listar(dto: ListarPublicacionesDto) {
    const offset = dto.offset ?? 0;// Valores por defecto 
    const limit = dto.limit ?? 10;

    // Filtro las activas 
    // Record<string, any> = objeto con claves de texto
    const filtro: Record<string, any> = { activa: true };
    if (dto.usuarioId) filtro.usuario = dto.usuarioId;// Si pidieron las de un usuario en particular, lo agrego al filtro

    // Orden
    // 1 = ascendente
    // 1 = descendente
    // Por me gusta, desempata por fecha; el _id final asegura un orden estable
    const orden: Record<string, 1 | -1> =
      dto.orden === 'meGusta' ? { cantidadMeGusta: -1, createdAt: -1, _id: -1 } : { createdAt: -1, _id: -1 };

    // Hago las dos consultas a la vez (Promise.all) la pagina pedida
    // Y el total (para calcular cuantas pag hay)
    const [items, total] = await Promise.all([
      this.publicacionModel
        .find(filtro) // las que cumplen
        .sort(orden) // en este orden
        .skip(offset) // salteando las "offset"
        .limit(limit) // y trayendo como max
        .populate('usuario', CAMPOS_AUTOR) // con los datos del autor
        .lean() // objetos simples, mas livianos
        .exec(), // ejecuta la consulta
      this.publicacionModel.countDocuments(filtro).exec(), // cuantas hay EN TOTAL con ese filtro
    ]);

    // Devuelvo la pag junto con los datos que el front necesita para paginar
    return { items, total, offset, limit };
  }

  // BAJA LOGICA: solo el autor o un administrador
  async eliminar(id: string, usuarioId: string) {
    // Busco la publicación (404 si no existe o ya estaba dada de baja)
    const publicacion = await this.buscarActiva(id);
    // Buscamos a quien pide la baja (404 si no existe)
    const solicitante = await this.validarUsuario(usuarioId);

    // es el autor? Comparo ids como texto
    const esAutor = publicacion.usuario.toString() === usuarioId;
    // es admin?
    const esAdmin = solicitante.perfil === 'administrador';
    // Si no es ninguno: 403 Forbidden (se quien es pero no tiene permiso)
    if (!esAutor && !esAdmin) {
      throw new ForbiddenException('Solo el autor o un administrador pueden eliminar esta publicación');
    }

    // marco doc como inactivo
    publicacion.activa = false;
    await publicacion.save();// Guardamos el cambio.
  }

  // ME GUSTA: uno por usuario
  async darMeGusta(id: string, usuarioId: string) {
    // Compruebo que existan la publicacion y el usuario (404 si no)
    await this.buscarActiva(id);
    await this.validarUsuario(usuarioId);
    // Convertimos el id del usuario a ObjectId real
    const uid = new Types.ObjectId(usuarioId);

    // Filtro: la publicación activa en el usuario no esta en mg ($ne = "distinto de...")
    const filtro: Record<string, any> = { _id: id, activa: true, meGusta: { $ne: uid } };
    // Cambio: $addToSet agrega el id a la lista (sin duplicar) y $inc suma 1 al contador
    const cambio: Record<string, any> = { $addToSet: { meGusta: uid }, $inc: { cantidadMeGusta: 1 } };
    // Si dos clics llegan a la vez, solo uno puede modificar
    const resultado = await this.publicacionModel.updateOne(filtro, cambio).exec();

    // modifiedCount = cuantos documentos cambio
    // Si fue 0, es porque ya le habia dado mg
    if (resultado.modifiedCount === 0) {
      throw new ConflictException('Ya le diste me gusta a esta publicación');
    }
    // Devuelvo el estado actualizado
    return this.resumenMeGusta(id);
  }

  // QUITAR ME GUSTA: solo si estaba dado
  async quitarMeGusta(id: string, usuarioId: string) {
    await this.buscarActiva(id);
    await this.validarUsuario(usuarioId);
    const uid = new Types.ObjectId(usuarioId);

    // Filtro: la publicacion activa en la que ese usuario dio
    const filtro: Record<string, any> = { _id: id, activa: true, meGusta: uid };
    // Cambio: $pull saca el id de la lista y $inc resta 1 al contador
    const cambio: Record<string, any> = { $pull: { meGusta: uid }, $inc: { cantidadMeGusta: -1 } };
    const resultado = await this.publicacionModel.updateOne(filtro, cambio).exec();

    // Si no modifico nada, es que no le habia dado me gusta
    if (resultado.modifiedCount === 0) {
      throw new ConflictException('No habías dado me gusta a esta publicación');
    }
    return this.resumenMeGusta(id);
  }

  // Devuelve solo lo que cambio con un me gusta
  // el contador y la lista de quienes le dieron
  private async resumenMeGusta(id: string) {
    // select = traer solo esos dos campos
    const p = await this.publicacionModel.findById(id).select('cantidadMeGusta meGusta').lean().exec();
    // evita romper si fuera null; "?? 0" y "??
    return { cantidadMeGusta: p?.cantidadMeGusta ?? 0, meGusta: p?.meGusta ?? [] };
  }

  // Busca una publicación ACTIVA por id
  // Si el id es invalido o no existe o esta dada de baja: 404
  private async buscarActiva(id: string) {
    // Si el texto no tiene forma de id, ya se que no existe
    if (!isValidObjectId(id)) throw new NotFoundException('Publicación no encontrada');
    // Buscamos por id y que este actv
    const publicacion = await this.publicacionModel.findOne({ _id: id, activa: true }).exec();
    // Si no hay resultado, tiro 404.
    if (!publicacion) throw new NotFoundException('Publicación no encontrada');
    return publicacion;
  }

  // Comprueba que un usuario exista y este habilitado
  // Devuelvo el usuario
  private async validarUsuario(id: string) {
    const usuario = await this.usuariosService.findById(id);
    // Si no existe o esta deshabilitado (activo: false), 404.
    if (!usuario || !usuario.activo) throw new NotFoundException('Usuario no encontrado');
    return usuario;
  }
}