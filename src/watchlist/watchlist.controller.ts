import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Request,
  UseGuards,
  Param, // Added Param
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { WatchlistService } from './watchlist.service';
import { Watchlist } from './watchlist.schema';

@Controller('watchlist')
export class WatchlistController {
  constructor(private readonly watchlistService: WatchlistService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'))
  async addToWatchlist(
    @Body()
    body: { imdbID: string; Title: string; Poster: string; Year: string },
    @Request() req,
  ): Promise<Watchlist> {
    return this.watchlistService.addToWatchlist(req.user.userId, body);
  }

  @Get()
  @UseGuards(AuthGuard('jwt'))
  async getWatchlist(@Request() req): Promise<Watchlist[]> {
    return this.watchlistService.getWatchlist(req.user.userId);
  }

  // --- FIX: Change from @Body to @Param to match frontend URL structure ---
  @Delete(':imdbID')
  @UseGuards(AuthGuard('jwt'))
  async removeFromWatchlist(
    @Param('imdbID') imdbID: string,
    @Request() req,
  ): Promise<Watchlist> {
    return this.watchlistService.removeFromWatchlist(req.user.userId, imdbID);
  }
}
