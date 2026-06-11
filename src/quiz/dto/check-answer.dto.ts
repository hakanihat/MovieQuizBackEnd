import { IsString, IsNotEmpty } from 'class-validator';

export class CheckAnswerDto {
  @IsString()
  @IsNotEmpty()
  questionId: string;

  @IsString()
  selectedAnswer: string;
}
