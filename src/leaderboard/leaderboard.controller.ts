import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Query,
} from '@nestjs/common';
import { LeaderboardService } from './leaderboard.service';
import { Leaderboard } from './leaderboard.schema';
import { AuthGuard } from '@nestjs/passport';

@Controller('leaderboard')
export class LeaderboardController {
  constructor(private readonly leaderboardService: LeaderboardService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'))
  async create(@Body() entry: Leaderboard) {
    return this.leaderboardService.create(entry);
  }

  // Get Global Stats
  @Get('global')
  async getGlobal(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const { take, skip } = parsePaging(page, limit, 50);
    return this.leaderboardService.getGlobalLeaderboard(take, skip);
  }

  // Get List of Movies for Filter
  @Get('movies')
  async getMoviesList() {
    return this.leaderboardService.getLeaderboardMovies();
  }

  // Get Specific Movie Stats
  @Get('movie/:imdbID')
  async getMovieSpecific(
    @Param('imdbID') imdbID: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const { take, skip } = parsePaging(page, limit, 50);
    return this.leaderboardService.getMovieLeaderboard(imdbID, take, skip);
  }
}

// Clamp paging params so a client can't request an unbounded page.
function parsePaging(page?: string, limit?: string, defaultLimit = 50) {
  const p = Math.max(1, parseInt(page ?? '', 10) || 1);
  const take = Math.min(100, Math.max(1, parseInt(limit ?? '', 10) || defaultLimit));
  return { take, skip: (p - 1) * take };
}
