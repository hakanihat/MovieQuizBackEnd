// src/auth/auth.service.ts
import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { UserService } from '../user/user.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(username: string, password: string): Promise<any> {
    try {
      const user = await this.userService.validateUser(username, password);

      if (user) {
        const userObj = (user as any).toObject
          ? (user as any).toObject()
          : user;
        const {
          passwordHash,
          resetPasswordToken,
          resetPasswordExpires,
          ...result
        } = userObj;

        console.log(
          `[AuthService] Validated ${username}. Role from DB: ${userObj.role}`,
        );

        return {
          ...result,
          role: userObj.role,
        };
      }
      return null;
    } catch (e) {
      console.error('Error in validateUser:', e);
      return null;
    }
  }

  async login(user: any) {
    try {
      const payload = {
        username: user.username,
        sub: user._id || user.userId,
        role: user.role,
      };

      console.log(`[AuthService] Signing Token for ${user.username}...`);

      const token = this.jwtService.sign(payload);

      return {
        access_token: token,
        user: {
          userId: user._id || user.userId,
          username: user.username,
          role: user.role,
          avatar: user.avatar,
        },
      };
    } catch (error) {
      console.error('❌ LOGIN CRASH:', error.message);
      if (error.message.includes('secretOrPrivateKey')) {
        throw new InternalServerErrorException(
          'JWT Secret is missing! Check .env file.',
        );
      }
      throw new InternalServerErrorException(
        'Login failed. Check server logs.',
      );
    }
  }

  // --- FORGOT PASSWORD (Unchanged) ---
  async forgotPassword(email: string) {
    const user = await this.userService.findByEmail(email);
    if (!user) throw new NotFoundException('Email not found');

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = new Date(Date.now() + 3600000);
    await user.save();

    const resetUrl = `http://localhost:3000/reset-password/${resetToken}`;
    console.log(`\n=== [EMAIL SIMULATION] ===`);
    console.log(`To: ${email}`);
    console.log(`Link: ${resetUrl}`);
    console.log(`==========================\n`);

    return { message: 'Password reset link sent (check server console)' };
  }

  // --- RESET PASSWORD (Unchanged) ---
  async resetPassword(token: string, newPassword: string) {
    const user = await this.userService.findOneByResetToken(token);

    if (
      !user ||
      !user.resetPasswordExpires ||
      user.resetPasswordExpires < new Date()
    ) {
      throw new BadRequestException('Invalid or expired token');
    }

    const saltRounds = 10;
    user.passwordHash = await bcrypt.hash(newPassword, saltRounds);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();
    return { message: 'Password successfully reset' };
  }
}
