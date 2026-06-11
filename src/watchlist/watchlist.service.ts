import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Watchlist, WatchlistDocument } from './watchlist.schema';

@Injectable()
export class WatchlistService {
  constructor(
    @InjectModel(Watchlist.name)
    private watchlistModel: Model<WatchlistDocument>,
  ) {}

  /**
   * Adds a movie to a dedicated Watchlist collection.
   * Updates include full movie metadata (Title, Poster, Year) to ensure correct rendering.
   */
  async addToWatchlist(
    userId: string,
    movie: { imdbID: string; Title: string; Poster?: string; Year?: string },
  ): Promise<Watchlist> {
    // Check if the entry already exists to prevent duplicate documents in the collection
    const existing = await this.watchlistModel
      .findOne({ userId, imdbID: movie.imdbID })
      .exec();
    if (existing) {
      return existing;
    }

    const newEntry = new this.watchlistModel({ userId, ...movie });
    return newEntry.save();
  }

  /**
   * Removes a movie from the dedicated Watchlist collection.
   * Utilizes the userId and imdbID for unique identification.
   */
  async removeFromWatchlist(
    userId: string,
    imdbID: string,
  ): Promise<Watchlist> {
    const removed = await this.watchlistModel
      .findOneAndDelete({ userId, imdbID })
      .exec();
    if (!removed) {
      throw new NotFoundException('Watchlist entry not found');
    }
    return removed;
  }

  /**
   * Fetches all watchlist entries for a specific user.
   */
  async getWatchlist(userId: string): Promise<Watchlist[]> {
    return this.watchlistModel.find({ userId }).exec();
  }
}
