import {
  Controller,
  Get,
  Delete,
  Patch,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { UserService } from '../user/user.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin') // Apply 'admin' role check to the entire controller
export class AdminController {
  constructor(private readonly userService: UserService) {}

  @Get('dashboard')
  async getDashboardStats() {
    const users = await this.userService.findAll();
    return {
      totalUsers: users.length,
      users: users, // Send full list to frontend
    };
  }

  @Patch('users/:id/role')
  async updateUserRole(@Param('id') id: string, @Body('role') role: string) {
    // 👇 CRITICAL: Must return the result so the DB update is confirmed
    return this.userService.changeUserRole(id, role);
  }

  @Delete('users/:id')
  async deleteUser(@Param('id') id: string) {
    return this.userService.deleteUser(id);
  }
}
