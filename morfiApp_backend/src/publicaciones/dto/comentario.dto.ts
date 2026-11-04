//Sirve para crear y editar
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class ComentarioDto {
  @IsString({ message: 'El mensaje debe ser texto' })
  @IsNotEmpty({ message: 'El mensaje es obligatorio' })
  @MaxLength(500, { message: 'El mensaje no puede superar los 500 caracteres' })
  mensaje: string;
}