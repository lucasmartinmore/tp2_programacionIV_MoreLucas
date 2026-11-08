import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, isValidObjectId } from 'mongoose';
import { Comentario } from '../usuarios/entities/comentario.entity.js';
import { Publicacion } from './entities/publicacion.entity.js';
import { ComentarioDto } from './dto/comentario.dto.js';
import { ListarComentariosDto } from './dto/listar-comentarios.dto.js';
import type { PayloadJwt } from '../auth/auth.types.js'; // NUEVO: para saber quién pide y si es administrador

// Datos del autor que muestro junto a cada comentario
const CAMPOS_AUTOR = 'nombre apellido username imagenPerfilUrl';
//"no eliminado". Uso $ne:false y no "true" porque
// los comentarios viejos no tienen el campo "activo"
const VISIBLE = { $ne: false };

@Injectable()
export class ComentariosService {
  constructor(
    @InjectModel(Comentario.name) private readonly comentarioModel: Model<Comentario>,// Modelo de comentarios
    @InjectModel(Publicacion.name) private readonly publicacionModel: Model<Publicacion>,// Modelo de publicaciones
  ) {}

  // POST: agrega un comentario de "usuarioId" a la publi
  async crear(publicacionId: string, usuarioId: string, dto: ComentarioDto) {
    await this.verificarPublicacion(publicacionId);// 404 si la publicación no existe o la dieron de baja
    // Guardo la fecha (createdAt) 
    const creado = await this.comentarioModel.create({
      publicacion: publicacionId, usuario: usuarioId, mensaje: dto.mensaje,
    });
    // Lo devuelvo con los datos para que el front lo dibuje
    return this.comentarioModel.findById(creado._id).populate('usuario', CAMPOS_AUTOR).lean().exec();
  }

  // GET: comentarios de una publi, paginados, mas rte primero
  async listar(publicacionId: string, dto: ListarComentariosDto) {
    await this.verificarPublicacion(publicacionId);
    const offset = dto.offset ?? 0;
    const limit = dto.limit ?? 5;// Por defecto 5 comentarios por tanda
    const filtro = { publicacion: publicacionId };
    const [items, total] = await Promise.all([
      this.comentarioModel
        .find(filtro)
        .sort({ createdAt: -1, _id: -1 }) // más nuevos primero (_id desempata si hay misma fecha)
        .skip(offset) // saltea los ya mostrados
        .limit(limit) // trae la tanda
        .populate('usuario', CAMPOS_AUTOR)
        .lean()
        .exec(),
      this.comentarioModel.countDocuments(filtro).exec(),
    ]);
    return { items, total, offset, limit };
  }

  // PUT: cambia comentario (solo el autor)
  async modificar(publicacionId: string, comentarioId: string, usuarioId: string, dto: ComentarioDto) {
    await this.verificarPublicacion(publicacionId);
    if (!isValidObjectId(comentarioId)) throw new NotFoundException('Comentario no encontrado');// Id mal formado → 404 (evita que Mongoose tire un error 500)
    // Debe existir y pertenecer a esa publi
    const comentario = await this.comentarioModel.findOne({ _id: comentarioId, publicacion: publicacionId }).exec();
    if (!comentario) throw new NotFoundException('Comentario no encontrado');
    // Solo el autor puede editar 
    if (comentario.usuario.toString() !== usuarioId) {
      throw new ForbiddenException('Solo el autor puede editar su comentario');
    }
    comentario.mensaje = dto.mensaje;
    // Marca de "editado" 
    comentario.modificado = true;
    await comentario.save();
    return this.comentarioModel.findById(comentarioId).populate('usuario', CAMPOS_AUTOR).lean().exec();
  }

  // DELETE: baja logica. 
  // Puede el autor del comentario o un administrador
  async eliminar(publicacionId: string, comentarioId: string, usuario: PayloadJwt) {
    await this.verificarPublicacion(publicacionId);
    if (!isValidObjectId(comentarioId)) throw new NotFoundException('Comentario no encontrado');
    // Debe existir, ser de esa publi y no estar ya eliminado
    const comentario = await this.comentarioModel
      .findOne({ _id: comentarioId, publicacion: publicacionId, activo: VISIBLE })
      .exec();
    if (!comentario) throw new NotFoundException('Comentario no encontrado');
    // es autor o admin? el rol viene dentro del token
    const esAutor = comentario.usuario.toString() === usuario.sub;
    const esAdmin = usuario.perfil === 'administrador';
    // Si no es ninguno de los dos: 403 (no tenes permiso)
    if (!esAutor && !esAdmin) {
      throw new ForbiddenException('Solo el autor o un administrador pueden eliminar este comentario');
    }
    // Baja logica
    comentario.activo = false;
    await comentario.save();
  }

  // Lanza 404 si la publi no existe, esta dado de baja o el id mal formateado
  private async verificarPublicacion(id: string) {
    if (!isValidObjectId(id)) throw new NotFoundException('Publicación no encontrada');
    const existe = await this.publicacionModel.exists({ _id: id, activa: true });
    if (!existe) throw new NotFoundException('Publicación no encontrada');
  }
}