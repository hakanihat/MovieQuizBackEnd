import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type LeaderboardDocument = Leaderboard & Document;

@Schema()
export class Leaderboard {
  @Prop({ required: true })
  username: string;

  @Prop({ required: true })
  score: number;

  @Prop({ required: true })
  imdbID: string;

  // NEW: Store the Movie Name (e.g., "The Godfather")
  @Prop({ required: true })
  movieTitle: string;

  // NEW: Time taken in seconds (Lower is better for tie-breakers)
  @Prop({ required: true })
  timeTaken: number;

  @Prop({ default: Date.now })
  date: Date;

  @Prop()
  userId: string;
}

export const LeaderboardSchema = SchemaFactory.createForClass(Leaderboard);
