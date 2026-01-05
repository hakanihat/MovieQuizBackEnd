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
    MongooseModule.forRoot('mongodb://localhost:27017/movie_quiz'),
    LeaderboardModule,
    QuizModule,
    AuthModule,
    UserModule,
    WatchlistModule,
    FriendsModule, // <--- Add to main imports
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
