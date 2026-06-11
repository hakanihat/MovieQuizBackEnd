import {
  IsString,
  IsNotEmpty,
  IsArray,
  ValidateNested,
  IsInt,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class AnswerDto {
  @IsString()
  @IsNotEmpty()
  questionId: string;

  @IsString()
  selectedAnswer: string;
}

export class SubmitQuizDto {
  @IsString()
  @IsNotEmpty()
  imdbID: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AnswerDto)
  answers: AnswerDto[];

  @IsString()
  movieTitle: string;

  @IsInt()
  @Min(0)
  timeTaken: number;
}
