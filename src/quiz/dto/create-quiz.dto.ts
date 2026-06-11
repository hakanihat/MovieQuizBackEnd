import {
  IsString,
  IsNotEmpty,
  IsArray,
  ArrayMinSize,
  IsInt,
  Min,
} from 'class-validator';

export class CreateQuizDto {
  @IsString()
  @IsNotEmpty()
  imdbID: string;

  @IsString()
  @IsNotEmpty()
  questionText: string;

  @IsArray()
  @ArrayMinSize(2)
  @IsString({ each: true })
  choices: string[];

  @IsInt()
  @Min(0)
  correctIndex: number;
}
