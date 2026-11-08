import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { EstadisticasService } from './estadisticas.service.js';
import { RangoFechasDto } from './dto/rango-fechas.dto.js';
import { AuthGuard } from '../auth/auth.guard.js';
import { AdminGuard } from '../auth/admin.guard.js';

// Dos guards en cadena: token valido (AuthGuard) y perfil administrador (AdminGuard)
@UseGuards(AuthGuard, AdminGuard)
@Controller('estadisticas')
export class EstadisticasController {
  constructor(private readonly estadisticasService: EstadisticasService) {}

  // GET /estadisticas/publicaciones-por-usuario?desde=2026-11-01&hasta=2026-11-30
  @Get('publicaciones-por-usuario')
  publicacionesPorUsuario(@Query() dto: RangoFechasDto) {
    return this.estadisticasService.publicacionesPorUsuario(dto);
  }

  // GET /estadisticas/comentarios-por-dia?desde=...&hasta=...
  @Get('comentarios-por-dia')
  comentariosPorDia(@Query() dto: RangoFechasDto) {
    return this.estadisticasService.comentariosPorDia(dto);
  }

  // GET /estadisticas/comentarios-por-publicacion?desde=...&hasta=...
  @Get('comentarios-por-publicacion')
  comentariosPorPublicacion(@Query() dto: RangoFechasDto) {
    return this.estadisticasService.comentariosPorPublicacion(dto);
  }
}