// src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config'; // 1. Import Config tools
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import * as path from 'path'; // 2. Import 'path' to find the .env file

import { LeaderboardModule } from './leaderboard/leaderboard.module';
import { QuizModule } from './quiz/quiz.module';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { WatchlistModule } from './watchlist/watchlist.module';
import { FriendsModule } from './friends/friends.module';
import { MoviesModule } from './movies/movies.module';

@Module({
  imports: [
    // 3. FIX: Explicitly load the .env file from the root folder
    ConfigModule.forRoot({
      isGlobal: true, // Makes variables (like JWT_SECRET) available everywhere
      envFilePath: path.resolve(process.cwd(), '.env'), // Forces NestJS to find the file
    }),

    // Rate limiting: max 100 requests per minute per IP (protects login/register/reset from brute force)
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),

    // 4. FIX: Use 'forRootAsync' to wait for the .env file to load before connecting
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri:
          configService.get<string>('MONGO_URI') ||
          'mongodb://localhost:27017/movie_quiz',
      }),
      inject: [ConfigService],
    }),

    LeaderboardModule,
    QuizModule,
    AuthModule,
    UserModule,
    WatchlistModule,
    FriendsModule,
    MoviesModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
