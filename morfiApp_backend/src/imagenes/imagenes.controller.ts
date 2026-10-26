// Controller: decorador de clase que atiende rutas. . .
import { Controller, Get, Param, StreamableFile } from '@nestjs/common';//Get: ruta GET, Param: lee un pedazo variable de la URL  StreamableFile:devolver un archivo/bytes en vez de un JSON
import { ImagenesService } from './imagenes.service';

// Todas las rutas de este controller empiezan con /imagenes.
@Controller('imagenes')
export class ImagenesController {
  constructor(private readonly imagenesService: ImagenesService) {}// Nest nos entrega el service (inyección por constructor).
  @Get(':id')
  async ver(@Param('id') id: string) {// @Param('id') toma ese ":id" de la URL y lo pasa como el texto "id"
    const imagen = await this.imagenesService.obtener(id);// Pedimos la imagen al service (si no existe, el service lanza 404)
    // Devolvemos los bytes y le avisamos al navegador el tipo (png, jpeg...) para que la muestre como imagen.
    return new StreamableFile(imagen.datos, { type: imagen.tipo });
  }
}