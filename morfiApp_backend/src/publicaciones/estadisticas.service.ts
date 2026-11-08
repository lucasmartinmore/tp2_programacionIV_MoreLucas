import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Publicacion } from './entities/publicacion.entity.js';
import { Comentario } from '../usuarios/entities/comentario.entity.js';
import { RangoFechasDto } from './dto/rango-fechas.dto.js';

@Injectable()
export class EstadisticasService {
  constructor(
    @InjectModel(Publicacion.name) private readonly publicacionModel: Model<Publicacion>,
    @InjectModel(Comentario.name) private readonly comentarioModel: Model<Comentario>,
  ) {}

  // 1) Cantidad de publicaciones por usuario en el lapso 
  // (grafico de barras)
  async publicacionesPorUsuario(dto: RangoFechasDto) {
    const datos = await this.publicacionModel.aggregate([
      // $match = filtro: publicaciones activas creadas dentro del lapso
      { $match: { activa: true, createdAt: this.rango(dto) } },
      // $group = agrupa por autor y cuenta cuántas tiene cada uno
      { $group: { _id: '$usuario', cantidad: { $sum: 1 } } },
      // $sort = de mayor a menor
      { $sort: { cantidad: -1 } },
      // $project = renombra _id como "usuario" para poder usar populate
      { $project: { _id: 0, usuario: '$_id', cantidad: 1 } },
    ]);
    // populate reemplaza el id del usuario por su username
    await this.publicacionModel.populate(datos, { path: 'usuario', select: 'username' });
    return datos.map((d) => ({ usuario: d.usuario?.username ?? 'desconocido', cantidad: d.cantidad }));
  }

  // 2) Cantidad de comentarios por día en el lapso 
  // (grafico de lineas)
  comentariosPorDia(dto: RangoFechasDto) {
    return this.comentarioModel.aggregate([
      // Solo comentarios que no fueron eliminados y que estan en el lapso
      { $match: { activo: { $ne: false }, createdAt: this.rango(dto) } },
      // Agrupamos por dia: $dateToString convierte la fecha en "2026-11-05"
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, cantidad: { $sum: 1 } } },
      // Orden cronologico
      { $sort: { _id: 1 } },
      { $project: { _id: 0, fecha: '$_id', cantidad: 1 } },
    ]);
  }

  // 3) Cantidad de comentarios en cada publi en el lapso (grafico de torta). 
  // Las 10 con mas
  async comentariosPorPublicacion(dto: RangoFechasDto) {
    const datos = await this.comentarioModel.aggregate([
      { $match: { activo: { $ne: false }, createdAt: this.rango(dto) } },
      { $group: { _id: '$publicacion', cantidad: { $sum: 1 } } },
      { $sort: { cantidad: -1 } },
      // $limit = nos quedamos con las 10 primeras
      { $limit: 10 },
      { $project: { _id: 0, publicacion: '$_id', cantidad: 1 } },
    ]);
    await this.comentarioModel.populate(datos, { path: 'publicacion', select: 'titulo activa' });
    // Descartamos las publi dadas de baja
    return datos
      .filter((d) => d.publicacion?.activa)
      .map((d) => ({ publicacion: d.publicacion.titulo, cantidad: d.cantidad }));
  }

  // Arma el filtro de fechas {$gte: desde, $lte: hasta}
  //  Por defecto, los ultimos 30 dias
  private rango(dto: RangoFechasDto) {
    // "hasta" incluye todo ese dia (hasta las 23:59:59)
    const hasta = dto.hasta ? new Date(`${dto.hasta.slice(0, 10)}T23:59:59.999Z`) : new Date();
    const desde = dto.desde
      ? new Date(`${dto.desde.slice(0, 10)}T00:00:00.000Z`)
      : new Date(hasta.getTime() - 30 * 24 * 60 * 60 * 1000);
    return { $gte: desde, $lte: hasta };
  }
}