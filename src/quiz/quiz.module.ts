// src/quiz/quiz.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { QuizController } from './quiz.controller';
import { QuizService } from './quiz.service';
import { Quiz, QuizSchema } from './quiz.schema';
import { UserModule } from '../user/user.module';
import { LeaderboardModule } from '../leaderboard/leaderboard.module'; // <--- IMPORT THIS

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Quiz.name, schema: QuizSchema }]),
    UserModule,
    LeaderboardModule, // <--- REGISTER THIS
  ],
  controllers: [QuizController],
  providers: [QuizService],
  exports: [QuizService],
})
export class QuizModule {}
