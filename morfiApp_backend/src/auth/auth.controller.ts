import {
  Body, // @Body(): lee los datos que vienen en el cuerpo de la petición
  Controller, // @Controller(): marca la clase como controller
  FileTypeValidator, // valida que el archivo sea de cierto tipo
  HttpCode, // @HttpCode(): cambia el código de estado de la respuesta
  HttpStatus, // lista de codigos con nombre (HttpStatus.OK = 200)
  MaxFileSizeValidator, // valida el tamaño máximo del archivo
  ParseFilePipe, // pipe (guardia) que aplica las validaciones del archivo
  Post, // @Post(): ruta que responde al verbo POST
  UploadedFile, // @UploadedFile(): lee el archivo subido
  UseInterceptors, // @UseInterceptors(): agrega un "interceptor" a la ruta
  Req,
  UseGuards
} from '@nestjs/common';
//FileInterceptor: interceptor que recibe archivos (usa la librería multer por dentro).
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthService } from './auth.service.js';//El service con la lógica
import { RegisterDto } from './dto/register.dto.js';//DTOs con las reglas de los datos
import { LoginDto } from './dto/login.dto.js';
import { AuthGuard } from './auth.guard.js';
import type { RequestConUsuario } from './auth.types.js';

// Todas las rutas de esta clase empiezan con /auth.
@Controller('auth')// Controller: recibe peticiones y las deriva al service
export class AuthController {
  constructor(private readonly authService: AuthService) {}// Nest nos entrega AuthService (inyección por constructor).

  // Ruta: POST /auth/register
  @Post('register')
  // Antes de entrar al meto, fileInterceptor separa el archivo del campo "imagenPerfil"
  // del resto de los datos. El nombre debe ser IGUAL al que usa el front al armar el FormData.
  @UseInterceptors(FileInterceptor('imagenPerfil'))
  register(
    // Los campos del formulario. El ValidationPipe global los valida contra RegisterDto.
    @Body() dto: RegisterDto,
    @UploadedFile(// El archivo subido, validado por ParseFilePipe
      new ParseFilePipe({
        fileIsRequired: false,// La foto es opcional: si no viene, no es error
        // Reglas del archivo:
        validators: [
          new MaxFileSizeValidator({
            maxSize: 2 * 1024 * 1024,// Tamaño máximo: 2 * 1024 * 1024 = 2 MB expresados en bytes
            message: 'La imagen no puede superar los 2MB',
          }),
          new FileTypeValidator({ fileType: /^image\/(jpeg|png|webp)$/ }),// Solo imágenes JPEG, PNG o WEBP
        ],
      }),
    )
    // El archivo (puede ser undefined si no subió foto, por el "?").
    imagen?: Express.Multer.File,
  ) {
    // El controller solo deriva al service
    // Un POST responde 201 (Created) por defecto, correcto para un registro
    return this.authService.register(dto, imagen);
  }

  // Ruta: POST /auth/login
  @Post('login')
  // Por defecto un POST responde 201, pero el login no crea nada: forzamos 200 (OK).
  @HttpCode(HttpStatus.OK)
  // @Body() trae { identificador, password } ya validados contra LoginDto.
  login(@Body() dto: LoginDto) {
    // Derivamos al service.
    return this.authService.login(dto);
  }

  // POST /auth/autorizar: valida el token (lo hace el guard) y devuelve los datos del usuario
  @UseGuards(AuthGuard) // sin token valido el guard corta con 401 no se ejec
  @Post('autorizar')
  @HttpCode(HttpStatus.OK) // POST responde 201 por defecto
  autorizar(@Req() req: RequestConUsuario) {
    // req.user lo dejo el guard; sub = _id del usuario
    return this.authService.autorizar(req.user.sub);
  }

  // POST /auth/refrescar: devuelve un token nuevo con 15s mas
  @UseGuards(AuthGuard)
  @Post('refrescar')
  @HttpCode(HttpStatus.OK)
  refrescar(@Req() req: RequestConUsuario) {
    // Pasamos el payload verificado para reconstruir el token
    return this.authService.refrescar(req.user);
  }
}