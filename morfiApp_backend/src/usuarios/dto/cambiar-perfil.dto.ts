import { IsIn } from 'class-validator';

// El perfil nuevo que el administrador le asigna a otro usuario
export class CambiarPerfilDto {
  // Solo se aceptan las dos opciones
  @IsIn(['usuario', 'administrador'], { message: "El perfil debe ser 'usuario' o 'administrador'" })
  perfil: 'usuario' | 'administrador';
}