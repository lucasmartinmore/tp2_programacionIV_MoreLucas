// Importamos los "validadores"
import {
  IsDateString, // Texto con formato de fecha ISO (AAAA-MM-DD)
  IsEmail, // Tiene que parecer un correo (algo@algo.com)
  IsNotEmpty, // No puede estar vacío
  IsOptional, // Este campo puede no venir
  IsString, // Tiene que ser texto
  Matches, // Tiene que cumplir un patrón 
  MaxLength, // Largo máximo
  MinLength, // Largo mínimo
} from 'class-validator';

// DTO = Data Transfer Object. Describe los datos que ENTRAN para crear un usuario y las reglas que deben cumplir.
export class CreateUsuarioDto {
  @IsString({ message: 'El nombre debe ser texto' })
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  nombre: string;

  @IsString({ message: 'El apellido debe ser texto' })
  @IsNotEmpty({ message: 'El apellido es obligatorio' })
  apellido: string;

  // El primer {} son opciones propias de la regla (no usamos ninguna); el segundo trae el mensaje.
  @IsEmail({}, { message: 'El correo no tiene un formato válido' })
  email: string;

  @IsString()
  @MinLength(3, { message: 'El nombre de usuario debe tener al menos 3 caracteres' })
  @MaxLength(20, { message: 'El nombre de usuario puede tener hasta 20 caracteres' })
  username: string;

  @IsString()
  @Matches(/^(?=.*[A-Z])(?=.*\d).{8,}$/, {
    message: 'La contraseña debe tener al menos 8 caracteres, una mayúscula y un número',
  })
  // Propiedad "password" (acá llega la contraseña REAL escrita por la persona; se hashea después en AuthService).
  password: string;

  @IsDateString({}, { message: 'La fecha de nacimiento debe tener formato AAAA-MM-DD' })
  fechaNacimiento: string;

  @IsOptional()
  @IsString()
  @MaxLength(200, { message: 'La descripción puede tener hasta 200 caracteres' })
  // El "?" también indica en TypeScript que puede faltar.
  descripcion?: string;
}