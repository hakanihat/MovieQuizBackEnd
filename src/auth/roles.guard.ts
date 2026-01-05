import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Retrieve the roles metadata defined by the @Roles decorator
    const requiredRoles = this.reflector.getAllAndOverride<string[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles) {
      // No roles required, allow access
      return true;
    }
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    // Allow if the user's role is one of the required roles
    return requiredRoles.includes(user.role);
  }
}
