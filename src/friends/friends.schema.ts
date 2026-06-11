import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type FriendRequestDocument = FriendRequest & Document;

@Schema({ timestamps: true })
export class FriendRequest {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  requester: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  recipient: Types.ObjectId;

  @Prop({
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending',
  })
  status: string;
}

export const FriendRequestSchema = SchemaFactory.createForClass(FriendRequest);

// Friendship lookups query by either side of the pair, so index both directions.
FriendRequestSchema.index({ requester: 1, recipient: 1 });
FriendRequestSchema.index({ recipient: 1, status: 1 });
FriendRequestSchema.index({ requester: 1, status: 1 });
