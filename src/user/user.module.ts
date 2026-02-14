// src/user/user.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { User, UserSchema } from './user.schema';
import { FriendsModule } from '../friends/friends.module';
import { WatchlistModule } from '../watchlist/watchlist.module';

// 1. Import the new Admin Controller
// (Make sure the file path matches where you saved admin.controller.ts)
import { AdminController } from '../admin/admin.controller';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    FriendsModule,
    WatchlistModule,
  ],
  providers: [UserService],
  // 2. Register it in the controllers array here
  controllers: [UserController, AdminController],
  exports: [UserService],
})
export class UserModule {}
