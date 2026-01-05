import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { FriendsService } from './friends.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@Controller('friends')
export class FriendsController {
  constructor(private readonly friendsService: FriendsService) {}

  // 1. Send Friend Request
  @UseGuards(JwtAuthGuard)
  @Post('request/:recipientId')
  async sendRequest(@Request() req, @Param('recipientId') recipientId: string) {
    return this.friendsService.sendRequest(req.user.userId, recipientId);
  }

  // 2. Accept Friend Request
  @UseGuards(JwtAuthGuard)
  @Post('accept/:requesterId')
  async acceptRequest(
    @Request() req,
    @Param('requesterId') requesterId: string,
  ) {
    return this.friendsService.acceptRequest(req.user.userId, requesterId);
  }

  // 3. Get My Friends List
  @UseGuards(JwtAuthGuard)
  @Get()
  async getMyFriends(@Request() req) {
    return this.friendsService.getFriends(req.user.userId);
  }

  // 4. Get Incoming Requests (Inbox)
  @UseGuards(JwtAuthGuard)
  @Get('requests/incoming')
  async getIncomingRequests(@Request() req) {
    return this.friendsService.getPendingRequests(req.user.userId);
  }

  // 5. Reject/Cancel Request
  @UseGuards(JwtAuthGuard)
  @Delete('requests/:id')
  async rejectRequest(@Request() req, @Param('id') requestId: string) {
    return this.friendsService.rejectRequest(req.user.userId, requestId);
  }

  // 6. NEW: Unfriend (Remove a friend)
  @UseGuards(JwtAuthGuard)
  @Delete(':friendId')
  async unfriend(@Request() req, @Param('friendId') friendId: string) {
    return this.friendsService.removeFriend(req.user.userId, friendId);
  }
}
