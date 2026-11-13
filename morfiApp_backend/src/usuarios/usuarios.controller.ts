import { FileInterceptor } from '@nestjs/platform-express';
import { UsuariosService } from './usuarios.service.js';
import { UpdatePerfilDto } from './dto/update-perfil.dto.js';
import { CrearUsuarioAdminDto } from './dto/create-usuario-admin.dto.js';
import { AuthGuard } from '../auth/auth.guard.js';
import { AdminGuard } from '../auth/admin.guard.js';
import type { RequestConUsuario } from '../auth/auth.types.js';
import { CambiarPerfilDto } from './dto/cambiar-perfil.dto.js';

import {
  Body, Controller, Delete, FileTypeValidator, Get, HttpCode, HttpStatus, MaxFileSizeValidator,
  Param, ParseFilePipe, Post, Put, Req, UploadedFile, UseGuards, UseInterceptors,
} from '@nestjs/common';

// Validacion de la imagen (2 MB y jpg/png/webp)
//  reutilizada en las dos rutas que reciben foto
const PIPE_IMAGEN = new ParseFilePipe({
  fileIsRequired: false,
  validators: [
    new MaxFileSizeValidator({ maxSize: 2 * 1024 * 1024, message: 'La imagen no puede superar los 2MB' }),
    new FileTypeValidator({ fileType: /^image\/(jpeg|png|webp)$/ }),
  ],
});

// Todas las rutas del controller exigen token valido
@UseGuards(AuthGuard)
@Controller('usuarios')
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  // PUT /usuarios/perfil ---> cualquier usuario logueado modifica SU perfil (el id sale del token)
  @Put('perfil')
  @UseInterceptors(FileInterceptor('imagenPerfil'))
  actualizarPerfil(
    @Req() req: RequestConUsuario,
    @Body() dto: UpdatePerfilDto,
    @UploadedFile(PIPE_IMAGEN) imagen?: Express.Multer.File,
  ) {
    return this.usuariosService.actualizarPerfil(req.user.sub, dto, imagen);
  }

  // GET /usuarios ---> listado (solo administrador)
  // Con dos guards: primero AuthGuard (clase), despues AdminGuard
  @UseGuards(AdminGuard)
  @Get()
  listar() {
    return this.usuariosService.listar();
  }

  // POST /usuarios --> alta de un usuario con el perfil elegido (solo administrador)
  @UseGuards(AdminGuard)
  @Post()
  @UseInterceptors(FileInterceptor('imagenPerfil'))
  crear(@Body() dto: CrearUsuarioAdminDto, @UploadedFile(PIPE_IMAGEN) imagen?: Express.Multer.File) {
    return this.usuariosService.crearDesdeAdmin(dto, imagen);
  }

  // DELETE /usuarios/:id ---> deshabilita (baja logica) (solo administrador)
  @UseGuards(AdminGuard)
  @Delete(':id')
  @HttpCode(HttpStatus.OK) // devolvemos el usuario actualizado, así que 200 y no 204
  deshabilitar(@Param('id') id: string, @Req() req: RequestConUsuario) {
    return this.usuariosService.cambiarEstado(id, false, req.user.sub);
  }

  // POST /usuarios/:id/habilitar ---> alta logica (solo administrador)
  @UseGuards(AdminGuard)
  @Post(':id/habilitar')
  @HttpCode(HttpStatus.OK)
  habilitar(@Param('id') id: string, @Req() req: RequestConUsuario) {
    return this.usuariosService.cambiarEstado(id, true, req.user.sub);
  }

  // PUT /usuarios/:id/perfil → cambia el perfil de otro usuario (solo administrador)
  @UseGuards(AdminGuard)
  @Put(':id/perfil')
  @HttpCode(HttpStatus.OK)
  cambiarPerfil(@Param('id') id: string, @Body() dto: CambiarPerfilDto, @Req() req: RequestConUsuario) {
    return this.usuariosService.cambiarPerfil(id, dto.perfil, req.user.sub);
  }
}