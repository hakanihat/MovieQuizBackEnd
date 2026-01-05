import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { User, UserSchema } from './user.schema';
import { FriendsModule } from '../friends/friends.module';
import { WatchlistModule } from '../watchlist/watchlist.module'; // Add this

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    FriendsModule,
    WatchlistModule, // CRITICAL: Links WatchlistService to UserController
  ],
  providers: [UserService],
  controllers: [UserController],
  exports: [UserService],
})
export class UserModule {}
