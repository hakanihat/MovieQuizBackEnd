import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type QuizDocument = Quiz & Document;

@Schema()
export class Quiz {
  @Prop({ required: true })
  imdbID: string; // Reference to the movie

  @Prop({ required: true })
  questionText: string; // The quiz question

  @Prop({ required: true, type: [String] })
  choices: string[]; // Array of answer choices

  @Prop({ required: true })
  correctIndex: number; // Index of the correct answer in the choices array
}

export const QuizSchema = SchemaFactory.createForClass(Quiz);
