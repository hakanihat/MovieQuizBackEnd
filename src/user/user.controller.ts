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
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RegisterDto } from './dto/register.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

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
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('register')
  async register(@Body() body: RegisterDto) {
    const { username, email, password } = body;
    const created = await this.userService.create(username, email, password);
    // Never return passwordHash or reset tokens to the client
    return {
      _id: created._id,
      username: created.username,
      email: created.email,
      avatar: created.avatar,
      role: created.role,
    };
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
  async updateProfile(@Request() req, @Body() body: UpdateProfileDto) {
    const userId = req.user.userId;
    // Explicitly pass only the avatar — never spread the raw body into the
    // update, so privileged fields (role, passwordHash, …) can't be set.
    return this.userService.update(userId, { avatar: body.avatar });
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
