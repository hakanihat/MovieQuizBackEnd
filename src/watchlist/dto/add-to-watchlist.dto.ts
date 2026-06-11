import { IsOptional, IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class AddToWatchlistDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  imdbID: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(300)
  Title: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  Poster?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  Year?: string;
}
