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

  @Prop({ default: 'user' }) // 'user' or 'admin'
  role: string;

  @Prop({ type: [], default: [] })
  watchlist: any[];

  @Prop({ type: [], default: [] })
  quizResults: any[];

  // --- NEW: FORGOT PASSWORD FIELDS ---
  @Prop()
  resetPasswordToken?: string;

  @Prop()
  resetPasswordExpires?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
