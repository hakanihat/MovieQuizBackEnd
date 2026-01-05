import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './user.schema';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async create(
    username: string,
    email: string,
    password: string,
  ): Promise<UserDocument> {
    const existingUser = await this.userModel.findOne({
      $or: [{ username }, { email }],
    });
    if (existingUser) {
      throw new ConflictException('Username or email already exists');
    }
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const createdUser = new this.userModel({
      username,
      email,
      passwordHash,
      watchlist: [],
      quizResults: [],
    });
    return createdUser.save();
  }

  async findByUsername(username: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ username }).exec();
  }

  async findById(id: string): Promise<any> {
    return this.userModel.findById(id).lean().exec();
  }

  // --- NEW: Search Users ---
  async search(query: string): Promise<any[]> {
    if (!query) return [];
    return this.userModel
      .find({
        username: { $regex: query, $options: 'i' }, // Case-insensitive regex
      })
      .select('username avatar _id') // Only return public info
      .limit(10)
      .lean()
      .exec();
  }

  async validateUser(
    username: string,
    password: string,
  ): Promise<UserDocument | null> {
    const user = await this.findByUsername(username);
    if (user && (await bcrypt.compare(password, user.passwordHash))) {
      return user;
    }
    return null;
  }

  async updateRole(userId: string, role: string): Promise<UserDocument> {
    const updatedUser = await this.userModel
      .findByIdAndUpdate(userId, { role }, { new: true })
      .exec();
    if (!updatedUser) {
      throw new NotFoundException('User not found');
    }
    return updatedUser;
  }

  async addQuizResult(
    userId: string,
    result: {
      imdbID: string;
      score: number;
      movieTitle: string;
      timeTaken: number;
    },
  ) {
    return this.userModel.findByIdAndUpdate(
      userId,
      {
        $push: {
          quizResults: {
            ...result,
            date: new Date(),
          },
        },
      },
      { new: true },
    );
  }

  async hasUserCompletedQuiz(userId: string, imdbID: string): Promise<boolean> {
    const user = await this.userModel.findById(userId).lean().exec();
    if (!user || !user.quizResults) return false;
    return user.quizResults.some((q) => q.imdbID === imdbID);
  }

  async update(
    userId: string,
    updateData: Partial<User>,
  ): Promise<UserDocument | null> {
    return this.userModel
      .findByIdAndUpdate(userId, updateData, { new: true })
      .exec();
  }
}
