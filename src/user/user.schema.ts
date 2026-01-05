import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema()
export class User {
  @Prop({ required: true, unique: true })
  username: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  passwordHash: string;

  @Prop({
    default:
      'https://upload.wikimedia.org/wikipedia/commons/0/0b/Netflix-avatar.png',
  })
  avatar: string;

  @Prop({ default: 'user' })
  role: string;

  // --- CRITICAL FIX: ARRAY DEFINITIONS ---
  // Using type: [] ensures Mongoose creates a path for these arrays in the database.
  // Without these @Prop definitions, Mongoose ignores data pushed to these fields.

  @Prop({ type: [], default: [] })
  watchlist: any[];

  @Prop({ type: [], default: [] })
  quizResults: any[];
}

export const UserSchema = SchemaFactory.createForClass(User);
