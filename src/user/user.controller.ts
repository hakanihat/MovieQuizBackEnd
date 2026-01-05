// src/user/user.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Request,
  Patch,
  Param,
  NotFoundException,
  Query,
} from '@nestjs/common';
import { UserService } from './user.service';
import { FriendsService } from '../friends/friends.service';
import { WatchlistService } from '../watchlist/watchlist.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('users')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly friendsService: FriendsService,
    private readonly watchlistService: WatchlistService,
  ) {}

  /**
   * 👇 NEW REGISTER ROUTE 👇
   * POST /users/register
   * Creates a new user. Public access (No Guard).
   */
  @Post('register')
  async register(@Body() body: any) {
    // Extract fields from the request body
    const { username, email, password } = body;
    // Call service to create user (which handles hashing)
    return this.userService.create(username, email, password);
  }
  /** 👆 END NEW ROUTE 👆 */

  /**
   * GET /users/search?q=username
   * Searches for users by username (partial match).
   */
  @UseGuards(JwtAuthGuard)
  @Get('search')
  async searchUsers(@Query('q') query: string) {
    return this.userService.search(query);
  }

  /**
   * GET /users/profile
   * Returns the authenticated user's own profile data.
   */
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@Request() req) {
    const userId = req.user.userId;
    return this.userService.findById(userId);
  }

  /**
   * PATCH /users/profile
   * Allows users to update their own profile fields.
   */
  @UseGuards(JwtAuthGuard)
  @Patch('profile')
  async updateProfile(@Request() req, @Body() body: { avatar?: string }) {
    const userId = req.user.userId;
    return this.userService.update(userId, body);
  }

  /**
   * GET /users/:id/profile
   * Returns public profile information for a target user.
   */
  @UseGuards(JwtAuthGuard)
  @Get(':id/profile')
  async getPublicProfile(@Request() req, @Param('id') targetUserId: string) {
    const currentUserId = req.user.userId;

    const targetUser = await this.userService.findById(targetUserId);
    if (!targetUser) {
      throw new NotFoundException('User not found');
    }

    let isFriend = false;
    let friendRequestSent = false;

    if (currentUserId !== targetUserId) {
      const statusObj = await this.friendsService.getFriendshipStatus(
        currentUserId,
        targetUserId,
      );
      isFriend = statusObj.isFriend;

      if (
        statusObj.status === 'pending' &&
        statusObj.requester === currentUserId
      ) {
        friendRequestSent = true;
      }
    } else {
      isFriend = true;
    }

    const publicWatchlist = isFriend
      ? await this.watchlistService.getWatchlist(targetUserId)
      : [];

    const publicQuizResults = isFriend ? targetUser.quizResults || [] : [];

    console.log(
      `[DEBUG] Profile Access for ${targetUser.username}: isFriend=${isFriend}, Watchlist=${publicWatchlist.length} items.`,
    );

    return {
      _id: targetUser._id,
      username: targetUser.username,
      avatar: targetUser.avatar,
      watchlist: publicWatchlist,
      quizResults: publicQuizResults,
      isFriend,
      friendRequestSent,
    };
  }
}
