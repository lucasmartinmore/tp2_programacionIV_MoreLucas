import { Injectable, UnauthorizedException, ForbiddenException } from '@nestjs/common';// UnauthorizedException: error que Nest convierte en respuesta 401.
import { PasswordHasher } from '@nestjs/authentication';// Tiene hash() (convertir contraseña en hash) y verify() (comprobarla).
import { JwtService } from '@nestjs/jwt';// JwtService: herramienta para firmar (crear) tokens
import { UsuariosService } from '../usuarios/usuarios.service.js';// UsuariosService: la lógica de usuarios (verificar, crear, buscar).
import { ImagenesService } from '../imagenes/imagenes.service.js';// ImagenesService: guarda la foto de perfil.
import { RegisterDto } from './dto/register.dto.js';// Los DTOs: la forma de los datos del registro y del login.
import { LoginDto } from './dto/login.dto.js';
import type { PayloadJwt } from './auth.types.js';// el tipo del contenido (payload) del token

// Service de autenticación
// La logica de registrarse / iniciar sesión
@Injectable()
export class AuthService {
  constructor(
    private readonly usuariosService: UsuariosService, // Para trabajar con usuarios
    private readonly imagenesService: ImagenesService,// Para guardar la foto
    private readonly passwordHasher: PasswordHasher,// Para hashear y verificar contraseñas
    private readonly jwtService: JwtService,// Para firmar los tokens
  ) {}
  async register(dto: RegisterDto, imagen?: Express.Multer.File) {//// REGISTRO. "dto" = datos de texto ya validados
    // Verifico correo/user: existe ese correo o username
    // Si existe, esta linea lanza un 409 y el metodo se corta 
    await this.usuariosService.verificarDisponibilidad(dto.email, dto.username);

    // Verifico foto: asumiendo que no hay (null).
    let imagenPerfilUrl: string | null = null;
    // Si la persona subio una foto la subo a Cloudinary y me devuelve directamente la URL public
    if (imagen) {
      imagenPerfilUrl = await this.imagenesService.subir(imagen);
    }

    // Hasheo de contras: La contraseña real deja de existir en el programa
    const password = await this.passwordHasher.hash(dto.password);

    // Guardo el usuario { ...dto, password } copia todos los datos pero reemplazo "password" por el hash
    const usuario = await this.usuariosService.create({ ...dto, password }, imagenPerfilUrl);

    // Respuesta: respondo con el usuario sin la contraseña.
    // Ademas devuelvo el token 
    return { usuario: this.sinPassword(usuario), token: await this.generarToken(usuario) };
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
    // La contraseña es correcta pero la cuenta fue deshabilitada por un administrador
    // (lo comprobamos despues de la contra para no revelar el estado de cuentas)
    if (!usuario.activo) {
      throw new ForbiddenException('Tu cuenta está deshabilitada. Contactá a un administrador.');
    }

    // Finalizo todo ok. Devuelvo todos los datos del usuario (sin contraseña) y token. Nest responde 200 OK.
    return { usuario: this.sinPassword(usuario), token: await this.generarToken(usuario) };
  }

  // El guard que el token es valido
  // aca devuelvo los datos ACTUALES del usuario
  async autorizar(usuarioId: string) {
    // Busco al usuario en la base por su _id (el "sub" del token)
    const usuario = await this.usuariosService.findById(usuarioId);
    // Si no existe o está deshabilitado → 401
    if (!usuario || !usuario.activo) throw new UnauthorizedException('Usuario no disponible');
    // Devuelvo el usuario sin contraseña
    return this.sinPassword(usuario);
  }

  // Devuelvo un token nuevo con la misma payload y otros 40''
  async refrescar(payload: PayloadJwt) {
    // Compruebo que el usuario siga existiendo y habilitado (si no, lanza 401)
    await this.autorizar(payload.sub);
    const token = await this.jwtService.signAsync({
      sub: payload.sub,
      email: payload.email,
      username: payload.username,
      perfil: payload.perfil,
    });
    // Devuelvo solo el token nuevo
    return { token };
  }

  // Armo la payload con los datos del usuario y la firma 
  private generarToken(usuario: { _id: unknown; email: string; username: string; perfil: string }) {
    // Payload: quien es y su rol 
    const payload = {
      sub: String(usuario._id), // sub = el _id del usuario 
      email: usuario.email,
      username: usuario.username,
      perfil: usuario.perfil,
    };
    // signAsync firma con JWT_SECRET y agrega "iat" (emitido) y "exp" (vence)
    return this.jwtService.signAsync(payload);
  }

  // Metodo privado que prepara el usuario para enviarlo al cliente.
  private sinPassword(usuario: { toObject: () => Record<string, any> }) {// toObject() convierte el documento de Mongo en un objeto comun
    // (__v es un contador interno de Mongo que al front no le sirve.)
    const { password, __v, ...resto } = usuario.toObject();// Con "password, __v, ...resto" sacamos esos dos campos y juntamos todo lo demás en "resto"
    return resto;
  }
}