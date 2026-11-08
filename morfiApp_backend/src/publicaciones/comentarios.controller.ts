import { Body, Controller, Get, Param, Post, Put, Query, Req, UseGuards, HttpStatus, Delete, HttpCode } from '@nestjs/common';
import { ComentariosService } from './comentarios.service.js';
import { ComentarioDto } from './dto/comentario.dto.js';
import { ListarComentariosDto } from './dto/listar-comentarios.dto.js';
import { AuthGuard } from '../auth/auth.guard.js';
import type { RequestConUsuario } from '../auth/auth.types.js';

// Todas las rutas necesitan token
// La ruta base incluye el id de la publi
@UseGuards(AuthGuard)
@Controller('publicaciones/:publicacionId/comentarios')
export class ComentariosController {
  constructor(private readonly comentariosService: ComentariosService) {}

  // POST /publicaciones/:publicacionId/comentarios
  @Post()
  crear(@Param('publicacionId') publicacionId: string, @Req() req: RequestConUsuario, @Body() dto: ComentarioDto) {
    return this.comentariosService.crear(publicacionId, req.user.sub, dto);
  }

  // GET /publicaciones/:publicacionId/comentarios?offset=0&limit=5
  @Get()
  listar(@Param('publicacionId') publicacionId: string, @Query() dto: ListarComentariosDto) {
    return this.comentariosService.listar(publicacionId, dto);
  }

  // PUT /publicaciones/:publicacionId/comentarios/:comentarioId
  @Put(':comentarioId')
  modificar(
    @Param('publicacionId') publicacionId: string,
    @Param('comentarioId') comentarioId: string,
    @Req() req: RequestConUsuario,
    @Body() dto: ComentarioDto,
  ) {
    return this.comentariosService.modificar(publicacionId, comentarioId, req.user.sub, dto);
  }

  // DELETE /publicaciones/:publicacionId/comentarios/:comentarioId
  @Delete(':comentarioId')
  @HttpCode(HttpStatus.NO_CONTENT) // 204: se eliminO y no hay nada que devolver
  eliminar(
    @Param('publicacionId') publicacionId: string,
    @Param('comentarioId') comentarioId: string,
    @Req() req: RequestConUsuario,
  ) {
    // pasO todo el payload del token: el service necesita el id y el rol
    return this.comentariosService.eliminar(publicacionId, comentarioId, req.user);
  }
}