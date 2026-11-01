import { Injectable, UnauthorizedException } from '@nestjs/common';// UnauthorizedException: error que Nest convierte en respuesta 401.
import { PasswordHasher } from '@nestjs/authentication';// Tiene hash() (convertir contraseña en hash) y verify() (comprobarla).
import { UsuariosService } from '../usuarios/usuarios.service';// UsuariosService: la lógica de usuarios (verificar, crear, buscar).
import { ImagenesService } from '../imagenes/imagenes.service';// ImagenesService: guarda la foto de perfil.
import { RegisterDto } from './dto/register.dto';// Los DTOs: la forma de los datos del registro y del login.
import { LoginDto } from './dto/login.dto';

// Service de autenticación
// La logica de registrarse / iniciar sesión
@Injectable()
export class AuthService {
  // Nest nos entrega por inyección de dependencias
  constructor(
    private readonly usuariosService: UsuariosService, // Para trabajar con usuarios
    private readonly imagenesService: ImagenesService,// Para guardar la foto
    private readonly passwordHasher: PasswordHasher,// Para hashear y verificar contraseñas
  ) {}
  async register(dto: RegisterDto, imagen?: Express.Multer.File) {//// REGISTRO. "dto" = datos de texto ya validados
    // Verifico correo/user: existe ese correo o username? Si existe, esta línea lanza un 409 y el método se corta acá.
    await this.usuariosService.verificarDisponibilidad(dto.email, dto.username);

    // Verifico foto: asumiendo que no hay (null).
    let imagenPerfilUrl: string | null = null;
    if (imagen) {
      const idImagen = await this.imagenesService.guardar(imagen);//La guardO en Mongo y recibo su id
      // BASE_URL: dirección del servidor de env. Si no esta, usamos la local
      const baseUrl = process.env.BASE_URL ?? 'http://localhost:3000';
      // Armo la dirección completa de la foto: http://localhost:3000/imagenes/65f2c...
      imagenPerfilUrl = `${baseUrl}/imagenes/${idImagen}`;
    }

    // Hasheo de contras: La contraseña real deja de existir en el programa
    const password = await this.passwordHasher.hash(dto.password);

    // Guardo el usuario { ...dto, password } copia todos los datos pero reemplazo "password" por el hash
    const usuario = await this.usuariosService.create({ ...dto, password }, imagenPerfilUrl);

    // Respuesta: respondo con el usuario sin la contraseña.
    return this.sinPassword(usuario);
  }

  //Recibe identificador (correo o usuario) y contraseña
  async login(dto: LoginDto) {
    // Busco user: busco al usuario por correo o username. Puede devolver null si no existe
    const usuario = await this.usuariosService.findByEmailOrUsername(dto.identificador);

    // Armo el error 401 una sola vez. Uso el mismo mensaje si falla el usuario o la clave,
    // para no revelar cuales estan registrado
    const error = new UnauthorizedException('Credenciales incorrectas. Verifique usuario o Contraseña');
    if (!usuario) throw error;

    // Verifico: verificamos la contraseña. verify(claveEscrita, hashGuardado) devuelve true si coinciden.
    const coincide = await this.passwordHasher.verify(dto.password, usuario.password);
    // Si no coincide, lanzamos el mismo 401.
    if (!coincide) throw error;

    // Finalizo todo ok. Devuelvo todos los datos del usuario (sin contraseña). Nest responde 200 OK.
    return this.sinPassword(usuario);
  }

  // Metodo privado que prepara el usuario para enviarlo al cliente.
  private sinPassword(usuario: { toObject: () => Record<string, any> }) {// toObject() convierte el documento de Mongo en un objeto comun
    // (__v es un contador interno de Mongo que al front no le sirve.)
    const { password, __v, ...resto } = usuario.toObject();// Con "password, __v, ...resto" sacamos esos dos campos y juntamos todo lo demás en "resto"
    return resto;
  }
}