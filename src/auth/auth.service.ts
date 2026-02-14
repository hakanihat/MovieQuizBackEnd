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
import * as nodemailer from 'nodemailer'; // Import Nodemailer

@Injectable()
export class AuthService {
  private transporter: nodemailer.Transporter;

  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {
    // Initialize the email transporter
    this.transporter = nodemailer.createTransport({
      service: 'gmail', // Built-in support for Gmail
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }

  async validateUser(username: string, password: string): Promise<any> {
    const user = await this.userService.validateUser(username, password);
    if (user) {
      const doc = (user as any).toObject ? (user as any).toObject() : user;
      const {
        passwordHash,
        resetPasswordToken,
        resetPasswordExpires,
        ...result
      } = doc;
      return result;
    }
    return null;
  }

  async login(user: any) {
    const payload = { username: user.username, sub: user._id, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        userId: user._id,
        username: user.username,
        role: user.role,
        avatar: user.avatar,
      },
    };
  }

  // --- REAL FORGOT PASSWORD LOGIC ---
  async forgotPassword(email: string) {
    const user = await this.userService.findByEmail(email);
    if (!user) throw new NotFoundException('Email not found');

    // 1. Generate Token
    const resetToken = crypto.randomBytes(32).toString('hex');

    // 2. Save Token to DB (Valid for 1 hour)
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hour
    await user.save();

    // 3. Create Reset Link
    // Note: In production, change localhost:3000 to your deployed frontend URL
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const resetUrl = `${frontendUrl}/reset-password/${resetToken}`;

    // 4. Send Real Email
    const mailOptions = {
      from: `"Movie Quiz App" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Password Reset Request',
      html: `
        <div style="font-family: Arial, sans-serif; color: #333;">
          <h2 style="color: #e50914;">Reset Your Password</h2>
          <p>You requested a password reset for your Movie Quiz account.</p>
          <p>Click the button below to reset it:</p>
          <a href="${resetUrl}" style="background-color: #e50914; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Reset Password</a>
          <p style="margin-top: 20px; font-size: 0.9em; color: #666;">If you didn't ask for this, please ignore this email.</p>
          <p style="font-size: 0.8em; color: #aaa;">Link valid for 1 hour.</p>
        </div>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`[EMAIL SENT] Reset link sent to ${email}`);
      return { message: 'Password reset link sent to your email.' };
    } catch (error) {
      console.error('Email sending failed:', error);
      throw new InternalServerErrorException(
        'Failed to send email. Please try again later.',
      );
    }
  }

  // --- RESET PASSWORD (Unchanged, but included for completeness) ---
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

    // Clear token fields
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();
    return { message: 'Password successfully reset' };
  }
}
