import { IsIn } from 'class-validator';
import { CreateUsuarioDto } from './create-usuario.dto.js';

// Mismos datos que el registro + el perfil que elige el administrador
export class CrearUsuarioAdminDto extends CreateUsuarioDto {
  // Solo se aceptan estas dos palabras
  @IsIn(['usuario', 'administrador'], { message: "El perfil debe ser 'usuario' o 'administrador'" })
  perfil: 'usuario' | 'administrador';
}