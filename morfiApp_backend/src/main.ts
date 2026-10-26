import { NestFactory } from '@nestjs/core';// Sirve para crear la aplicación a partir de un módulo.
import { ValidationPipe } from '@nestjs/common';// Revisa los datos que llegan y aplica las reglas de los DTOs.
import { AppModule } from './app.module';// Módulo principal 
import * as dns from 'dns';// dns: herramienta de Node para consultar direcciones de internet (la usamos abajo para Mongo Atlas).

// Le decimos a Node que use los servidores DNS de Google. Sin esto, a veces Mongo Atlas
// no conecta y aparece el error "querySrv ECONNREFUSED". (El profe lo hace igual en clase.)
dns.setServers(['8.8.8.8', '8.8.4.4']);

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Activa el guardia de validaciones para TODAS las rutas de la aplicación (por eso "Global").
  app.useGlobalPipes(
    // whitelist: true -> elimina los campos que el DTO no declara.
    // forbidNonWhitelisted: true -> en vez de eliminarlos en silencio, responde error 400.
    // Con esto nadie puede mandar "perfil: administrador" al registrarse.
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
  );

  // CORS: el navegador, por seguridad, no deja que una página (Angular, en otra dirección)
  // le pida datos a este servidor, salvo que el servidor lo autorice. Esta línea lo autoriza.
  app.enableCors();
  // Pone el servidor a escuchar peticiones. Usa el puerto del .env (PORT) o, si no hay, el 3000.
  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();