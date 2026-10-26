// Traemos el DTO de crear usuario, porque el registro necesita exactamente esos mismos datos.
import { CreateUsuarioDto } from '../../usuarios/dto/create-usuario.dto';

// "extends" = hereda: RegisterDto tiene TODAS las propiedades y reglas de CreateUsuarioDto 
// "Repetir contraseña" se valida solo en el front; el back no necesita ese dato.
// La foto NO está acá: viaja como archivo aparte (ver auth.controller.ts).
export class RegisterDto extends CreateUsuarioDto {}