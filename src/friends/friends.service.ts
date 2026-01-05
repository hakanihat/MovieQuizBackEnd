import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { FriendRequest, FriendRequestDocument } from './friends.schema';

@Injectable()
export class FriendsService {
  constructor(
    @InjectModel(FriendRequest.name)
    private friendModel: Model<FriendRequestDocument>,
  ) {}

  // --- 1. Send Request ---
  async sendRequest(userId: string, recipientId: string) {
    if (userId === recipientId)
      throw new BadRequestException('Cannot add yourself');

    const existing = await this.friendModel.findOne({
      $or: [
        { requester: userId, recipient: recipientId },
        { requester: recipientId, recipient: userId },
      ],
    });

    if (existing) {
      if (existing.status === 'accepted')
        throw new BadRequestException('Already friends');
      if (existing.status === 'pending')
        throw new BadRequestException('Request pending');
    }

    const newRequest = new this.friendModel({
      requester: userId,
      recipient: recipientId,
      status: 'pending',
    });
    return newRequest.save();
  }

  // --- 2. Accept Request ---
  async acceptRequest(userId: string, requesterId: string) {
    const request = await this.friendModel.findOne({
      requester: requesterId,
      recipient: userId,
      status: 'pending',
    });

    if (!request) throw new NotFoundException('No pending request found');

    request.status = 'accepted';
    return request.save();
  }

  // --- 3. Get List of Friends ---
  async getFriends(userId: string) {
    const connections = await this.friendModel
      .find({
        $or: [{ requester: userId }, { recipient: userId }],
        status: 'accepted',
      })
      .populate('requester', 'username avatar')
      .populate('recipient', 'username avatar');

    return connections.map((conn) =>
      conn.requester['_id'].toString() === userId
        ? conn.recipient
        : conn.requester,
    );
  }

  // --- 4. Check Status (Helper) ---
  async getFriendshipStatus(userA: string, userB: string) {
    const connection = await this.friendModel.findOne({
      $or: [
        { requester: userA, recipient: userB },
        { requester: userB, recipient: userA },
      ],
    });

    if (!connection) return { isFriend: false, status: 'none' };
    return {
      isFriend: connection.status === 'accepted',
      status: connection.status,
      requester: connection.requester.toString(),
    };
  }

  // --- 5. Get Incoming Pending Requests ---
  async getPendingRequests(userId: string) {
    return this.friendModel
      .find({
        recipient: userId,
        status: 'pending',
      })
      .populate('requester', 'username avatar');
  }

  // --- 6. Reject or Cancel Request ---
  async rejectRequest(userId: string, requestId: string) {
    return this.friendModel.findOneAndDelete({
      _id: requestId,
      $or: [{ recipient: userId }, { requester: userId }],
    });
  }

  // --- 7. NEW: Remove Friend (Unfriend) ---
  async removeFriend(userId: string, friendId: string) {
    // Finds and deletes the friendship regardless of who initiated it
    return this.friendModel.findOneAndDelete({
      $or: [
        { requester: userId, recipient: friendId },
        { requester: friendId, recipient: userId },
      ],
    });
  }
}
