import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type WatchlistDocument = Watchlist & Document;

@Schema({ timestamps: true })
export class Watchlist {
  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  imdbID: string;

  // CHANGED: Capitalized to match OMDb format
  @Prop({ required: true })
  Title: string;

  // NEW: Store the image URL
  @Prop()
  Poster: string;

  // NEW: Store the release year
  @Prop()
  Year: string;

  @Prop({ default: Date.now })
  addedAt: Date;
}

export const WatchlistSchema = SchemaFactory.createForClass(Watchlist);
