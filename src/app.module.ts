// src/app.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LeaderboardModule } from './leaderboard/leaderboard.module';
import { QuizModule } from './quiz/quiz.module';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { WatchlistModule } from './watchlist/watchlist.module';
import { FriendsModule } from './friends/friends.module';

@Module({
  imports: [
    // FIX IS HERE: Use process.env.MONGO_URI
    MongooseModule.forRoot(
      process.env.MONGO_URI || 'mongodb://localhost:27017/movie_quiz',
    ),
    LeaderboardModule,
    QuizModule,
    AuthModule,
    UserModule,
    WatchlistModule,
    FriendsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
