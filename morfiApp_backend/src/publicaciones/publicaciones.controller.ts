import {
  Body, Controller, Delete, FileTypeValidator, Get, HttpCode, HttpStatus, MaxFileSizeValidator,
  Param, ParseFilePipe, Post, Query, Req, UploadedFile, UseGuards, UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { PublicacionesService } from './publicaciones.service.js';
import { CreatePublicacionDto } from './dto/create-prublicacion.dto.js';
import { ListarPublicacionesDto } from './dto/listar-publicaciones.dto.js';
// El guard y el tipo del request
import { AuthGuard } from '../auth/auth.guard.js';
import type { RequestConUsuario } from '../auth/auth.types.js';

@UseGuards(AuthGuard)
@Controller('publicaciones')
export class PublicacionesController {
  constructor(private readonly publicacionesService: PublicacionesService) {}

  @Post()
  @UseInterceptors(FileInterceptor('imagen'))
  crear(
    @Req() req: RequestConUsuario, // quien hace el pedido (del token)
    @Body() dto: CreatePublicacionDto,
    @UploadedFile(
      new ParseFilePipe({
        fileIsRequired: false,
        validators: [
          new MaxFileSizeValidator({ maxSize: 2 * 1024 * 1024, message: 'La imagen no puede superar los 2MB' }),
          new FileTypeValidator({ fileType: /^image\/(jpeg|png|webp)$/ }),
        ],
      }),
    )
    imagen?: Express.Multer.File,
  ) {
    return this.publicacionesService.crear(dto, req.user.sub, imagen);
  }

  @Get()
  listar(@Query() dto: ListarPublicacionesDto) {
    return this.publicacionesService.listar(dto);
  }

  // GET /publicaciones/:id (para el detalle)
  @Get(':id')
  obtener(@Param('id') id: string) {
    return this.publicacionesService.obtener(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  eliminar(@Param('id') id: string, @Req() req: RequestConUsuario) {
    // el service ya revisa "autor o administrador"
    return this.publicacionesService.eliminar(id, req.user.sub);
  }

  @Post(':id/me-gusta')
  darMeGusta(@Param('id') id: string, @Req() req: RequestConUsuario) {
    return this.publicacionesService.darMeGusta(id, req.user.sub);
  }

  @Delete(':id/me-gusta')
  quitarMeGusta(@Param('id') id: string, @Req() req: RequestConUsuario) {
    return this.publicacionesService.quitarMeGusta(id, req.user.sub);
  }
}