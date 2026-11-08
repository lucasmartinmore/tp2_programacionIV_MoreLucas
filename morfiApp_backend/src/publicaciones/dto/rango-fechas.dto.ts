import { IsDateString, IsOptional } from 'class-validator';

// El lapso elegido
//  dos fechas opcionales con formato AAAA-MM-DD
export class RangoFechasDto {
  @IsOptional()
  @IsDateString({}, { message: 'desde debe tener formato AAAA-MM-DD' })
  desde?: string;

  @IsOptional()
  @IsDateString({}, { message: 'hasta debe tener formato AAAA-MM-DD' })
  hasta?: string;
}