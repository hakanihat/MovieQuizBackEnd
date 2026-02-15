// src/user/user.service.ts
import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './user.schema'; // Check path if needed
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  // Create User (Register)
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
      passwordHash, // Saving the hashed password
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

  // Search Users
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

  // Validate User (Login) - UPDATED to support Email or Username
  async validateUser(
    identifier: string, // Changed parameter name to reflect it can be either
    pass: string,
  ): Promise<UserDocument | null> {
    // Search for user by either username OR email
    const user = await this.userModel
      .findOne({
        $or: [{ username: identifier }, { email: identifier }],
      })
      .exec();

    // Compare plain text password with stored hash if user is found
    if (user && (await bcrypt.compare(pass, user.passwordHash))) {
      return user;
    }
    return null;
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

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email }).exec();
  }

  async findOneByResetToken(token: string): Promise<UserDocument | null> {
    return this.userModel
      .findOne({
        resetPasswordToken: token,
        resetPasswordExpires: { $gt: Date.now() }, // Check if not expired
      })
      .exec();
  }

  // Helper for Admin Dashboard to get all users
  async findAll(): Promise<UserDocument[]> {
    return this.userModel.find().select('-passwordHash').exec();
  }

  async deleteUser(userId: string): Promise<any> {
    return this.userModel.findByIdAndDelete(userId).exec();
  }

  async hasUserCompletedQuiz(userId: string, imdbID: string): Promise<boolean> {
    const user = await this.userModel.findById(userId).lean().exec();
    if (!user || !user.quizResults) return false;
    return user.quizResults.some((q) => q.imdbID === imdbID);
  }

  async changeUserRole(userId: string, newRole: string): Promise<UserDocument> {
    const validRoles = ['user', 'admin'];

    if (!validRoles.includes(newRole)) {
      throw new ConflictException('Invalid role specified');
    }

    const updatedUser = await this.userModel
      .findByIdAndUpdate(userId, { role: newRole }, { new: true })
      .select('-passwordHash') // Don't return the password hash
      .exec();

    if (!updatedUser) {
      throw new NotFoundException('User not found');
    }

    return updatedUser;
  }

  // Ensure this existing method is robust for your AdminController
  async updateRole(userId: string, role: string): Promise<UserDocument> {
    const updatedUser = await this.userModel
      .findByIdAndUpdate(userId, { role }, { new: true })
      .select('-passwordHash')
      .exec();

    if (!updatedUser) {
      throw new NotFoundException('User not found');
    }
    return updatedUser;
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
