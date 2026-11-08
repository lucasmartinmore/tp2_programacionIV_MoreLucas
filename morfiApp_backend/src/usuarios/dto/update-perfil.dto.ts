import { IsDateString, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

// Todos opcionales: se manda solo lo que se quiere cambiar
//  No incluye email, username ni contraseña 
export class UpdatePerfilDto {
  @IsOptional()
  @IsString({ message: 'El nombre debe ser texto' })
  @IsNotEmpty({ message: 'El nombre no puede quedar vacío' })
  nombre?: string;

  @IsOptional()
  @IsString({ message: 'El apellido debe ser texto' })
  @IsNotEmpty({ message: 'El apellido no puede quedar vacío' })
  apellido?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200, { message: 'La descripción puede tener hasta 200 caracteres' })
  descripcion?: string;

  @IsOptional()
  @IsDateString({}, { message: 'La fecha de nacimiento debe tener formato AAAA-MM-DD' })
  fechaNacimiento?: string;
}