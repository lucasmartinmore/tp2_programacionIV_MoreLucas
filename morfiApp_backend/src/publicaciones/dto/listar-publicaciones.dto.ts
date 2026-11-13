// Type: de class-transformer; convierte el texto que llega en la URL ("5") al tipo que declaramos (número 5)
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsMongoId, IsOptional, Max, Min } from 'class-validator';

// Los parametros que acepta GET /publicaciones
export class ListarPublicacionesDto {
  // ordenar: 'fecha' (mas new primero) o 'meGusta' (mas new primero). Si no viene, usamos 'fecha'
  @IsOptional()
  @IsIn(['fecha', 'meGusta'], { message: "orden debe ser 'fecha' o 'meGusta'" })
  orden?: 'fecha' | 'meGusta';

  // Filtro: solo las publicaciones de este usuario 
  // lo usa Mi Perfil
  @IsOptional()
  @IsMongoId({ message: 'usuarioId inválido' })
  usuarioId?: string;

  // offset = cuantas publicaciones SALTEAR (para paginar)
  // @Type(() => Number) convierte el texto de la URL en numero antes de validar
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'offset debe ser un número entero' })
  @Min(0, { message: 'offset no puede ser negativo' })
  offset?: number;

  // limit = cuantas publicaciones TRAER por pagina
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'limit debe ser un número entero' })
  @Min(1, { message: 'limit debe ser al menos 1' })
  @Max(10, { message: 'limit no puede superar 10' })
  limit?: number;
}