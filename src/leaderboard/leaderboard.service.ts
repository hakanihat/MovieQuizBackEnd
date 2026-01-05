import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Leaderboard, LeaderboardDocument } from './leaderboard.schema';

@Injectable()
export class LeaderboardService {
  constructor(
    @InjectModel(Leaderboard.name)
    private leaderboardModel: Model<LeaderboardDocument>,
  ) {}

  async create(entry: Leaderboard): Promise<Leaderboard> {
    const createdEntry = new this.leaderboardModel(entry);
    return createdEntry.save();
  }

  // 1. GLOBAL LEADERBOARD (Sum of all scores per user)
  async getGlobalLeaderboard(): Promise<any[]> {
    return this.leaderboardModel.aggregate([
      {
        $group: {
          _id: '$userId', // Group by User
          username: { $first: '$username' }, // Keep the username
          totalScore: { $sum: '$score' }, // Sum their points
          totalTime: { $sum: '$timeTaken' }, // Sum their time
          quizzesTaken: { $sum: 1 }, // Count how many quizzes they took
        },
      },
      {
        $sort: { totalScore: -1, totalTime: 1 }, // Sort by Score (Desc), then Time (Asc)
      },
      { $limit: 50 }, // Top 50 Users
    ]);
  }

  // 2. MOVIE SPECIFIC LEADERBOARD
  async getMovieLeaderboard(imdbID: string): Promise<Leaderboard[]> {
    return this.leaderboardModel
      .find({ imdbID })
      .sort({ score: -1, timeTaken: 1 }) // High score, Low time
      .limit(50)
      .exec();
  }

  // 3. GET LIST OF MOVIES IN LEADERBOARD (For the Filter Dropdown)
  async getLeaderboardMovies(): Promise<any[]> {
    return this.leaderboardModel.aggregate([
      {
        $group: {
          _id: '$imdbID',
          movieTitle: { $first: '$movieTitle' },
        },
      },
      { $sort: { movieTitle: 1 } },
    ]);
  }

  // Helper for "Rank" calculation on submission (kept from previous steps)
  async calculateRank(score: number, timeTaken: number): Promise<number> {
    const betterCount = await this.leaderboardModel.countDocuments({
      $or: [
        { score: { $gt: score } },
        { score: { $eq: score }, timeTaken: { $lt: timeTaken } },
      ],
    });
    return betterCount + 1;
  }
}
