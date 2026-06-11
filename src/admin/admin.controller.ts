import {
  Controller,
  Get,
  Delete,
  Patch,
  Param,
  Body,
  UseGuards,
  Request,
  Query,
  BadRequestException,
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
  async getDashboardStats(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const p = Math.max(1, parseInt(page ?? '', 10) || 1);
    const l = Math.min(100, Math.max(1, parseInt(limit ?? '', 10) || 20));
    const skip = (p - 1) * l;

    const [users, totalUsers] = await Promise.all([
      this.userService.findAll(skip, l),
      this.userService.countUsers(),
    ]);

    return {
      totalUsers,
      page: p,
      limit: l,
      totalPages: Math.max(1, Math.ceil(totalUsers / l)),
      users,
    };
  }

  @Patch('users/:id/role')
  async updateUserRole(
    @Request() req,
    @Param('id') id: string,
    @Body('role') role: string,
  ) {
    if (id === req.user.userId) {
      throw new BadRequestException('You cannot change your own role');
    }
    return this.userService.changeUserRole(id, role);
  }

  @Delete('users/:id')
  async deleteUser(@Request() req, @Param('id') id: string) {
    if (id === req.user.userId) {
      throw new BadRequestException('You cannot delete your own account');
    }
    return this.userService.deleteUser(id);
  }
}
