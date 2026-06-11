// src/auth/auth.service.ts
import {
  Injectable,
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

  // --- FORGOT PASSWORD ---
  async forgotPassword(email: string) {
    // Always return the same response so attackers can't enumerate which
    // emails are registered.
    const genericResponse = {
      message: 'If that email is registered, a reset link has been sent.',
    };

    const user = await this.userService.findByEmail(email);
    if (!user) return genericResponse;

    // Store only a hash of the token; the raw token goes in the email link.
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = new Date(Date.now() + 3600000);
    await user.save();

    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const resetUrl = `${baseUrl}/reset-password/${resetToken}`;
    console.log(`\n=== [EMAIL SIMULATION] ===`);
    console.log(`To: ${email}`);
    console.log(`Link: ${resetUrl}`);
    console.log(`==========================\n`);

    return genericResponse;
  }

  // --- RESET PASSWORD ---
  async resetPassword(token: string, newPassword: string) {
    // Look up by the hashed form of the supplied token.
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');
    const user = await this.userService.findOneByResetToken(hashedToken);

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
