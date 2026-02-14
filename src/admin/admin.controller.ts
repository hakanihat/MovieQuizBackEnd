import { Controller, Get, Delete, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserService } from '../user/user.service';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminController {
  constructor(private readonly userService: UserService) {}

  @Get('dashboard')
  @Roles('admin') // Only Admins can access
  async getDashboardStats() {
    const users = await this.userService.findAll();
    const totalUsers = users.length;
    // You can calculate more stats here (e.g., total quizzes taken)
    return {
      totalUsers,
      users, // Send full list for the table
    };
  }

  @Delete('users/:id')
  @Roles('admin')
  async deleteUser(@Param('id') id: string) {
    return this.userService.deleteUser(id);
  }
}
