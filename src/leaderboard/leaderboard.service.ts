import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Leaderboard, LeaderboardDocument } from './leaderboard.schema';

// Lightweight in-memory cache entry.
interface CacheEntry<T> {
  value: T;
  expires: number;
}

@Injectable()
export class LeaderboardService {
  constructor(
    @InjectModel(Leaderboard.name)
    private leaderboardModel: Model<LeaderboardDocument>,
  ) {}

  // The global aggregation and movie list scan the whole collection, so we
  // cache their results briefly. Any new submission busts the cache.
  private readonly CACHE_TTL_MS = 60_000;
  private globalCache: CacheEntry<any[]> | null = null;
  private moviesCache: CacheEntry<any[]> | null = null;

  private invalidateCaches() {
    this.globalCache = null;
    this.moviesCache = null;
  }

  async create(entry: Leaderboard): Promise<Leaderboard> {
    const createdEntry = new this.leaderboardModel(entry);
    const saved = await createdEntry.save();
    this.invalidateCaches();
    return saved;
  }

  // 1. GLOBAL LEADERBOARD (Sum of all scores per user)
  // Only the default first page (top 50) is cached; custom pages bypass it.
  async getGlobalLeaderboard(limit = 50, skip = 0): Promise<any[]> {
    const isDefaultPage = skip === 0 && limit === 50;
    if (isDefaultPage && this.globalCache && this.globalCache.expires > Date.now()) {
      return this.globalCache.value;
    }

    const result = await this.leaderboardModel.aggregate([
      {
        $group: {
          _id: '$userId',
          username: { $first: '$username' },
          totalScore: { $sum: '$score' },
          totalTime: { $sum: '$timeTaken' },
          quizzesTaken: { $sum: 1 },
        },
      },
      { $sort: { totalScore: -1, totalTime: 1 } },
      { $skip: skip },
      { $limit: limit },
    ]);

    if (isDefaultPage) {
      this.globalCache = { value: result, expires: Date.now() + this.CACHE_TTL_MS };
    }
    return result;
  }

  // 2. MOVIE SPECIFIC LEADERBOARD
  async getMovieLeaderboard(
    imdbID: string,
    limit = 50,
    skip = 0,
  ): Promise<Leaderboard[]> {
    return this.leaderboardModel
      .find({ imdbID })
      .sort({ score: -1, timeTaken: 1 })
      .skip(skip)
      .limit(limit)
      .exec();
  }

  // 3. GET LIST OF MOVIES IN LEADERBOARD (For the Filter Dropdown)
  async getLeaderboardMovies(): Promise<any[]> {
    if (this.moviesCache && this.moviesCache.expires > Date.now()) {
      return this.moviesCache.value;
    }

    const result = await this.leaderboardModel.aggregate([
      {
        $group: {
          _id: '$imdbID',
          movieTitle: { $first: '$movieTitle' },
        },
      },
      { $sort: { movieTitle: 1 } },
    ]);

    this.moviesCache = { value: result, expires: Date.now() + this.CACHE_TTL_MS };
    return result;
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
