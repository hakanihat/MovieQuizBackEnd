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
  async getGlobal() {
    return this.leaderboardService.getGlobalLeaderboard();
  }

  // Get List of Movies for Filter
  @Get('movies')
  async getMoviesList() {
    return this.leaderboardService.getLeaderboardMovies();
  }

  // Get Specific Movie Stats
  @Get('movie/:imdbID')
  async getMovieSpecific(@Param('imdbID') imdbID: string) {
    return this.leaderboardService.getMovieLeaderboard(imdbID);
  }
}
