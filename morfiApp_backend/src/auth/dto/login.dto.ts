import { IsNotEmpty, IsString } from 'class-validator';// IsNotEmpty (no vacío) e IsString (tiene que ser texto)

// DTO del login, los datos que llegan cuando alguien quiere iniciar sesión.
export class LoginDto {
  @IsString()
  @IsNotEmpty({ message: 'Ingresá tu correo o nombre de usuario' })
  identificador: string;

  @IsString()
  @IsNotEmpty({ message: 'Ingresá tu contraseña' })
  // La contraseña SIN encriptar, tal como la escribió el usuario, se compara contra el hash guardado
  password: string;
}