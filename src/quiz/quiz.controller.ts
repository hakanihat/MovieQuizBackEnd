// src/quiz/quiz.controller.ts
import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { QuizService } from './quiz.service';
import { Quiz } from './quiz.schema';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { SubmitQuizDto } from './dto/submit-quiz.dto';
import { CheckAnswerDto } from './dto/check-answer.dto';
import { AuthGuard } from '@nestjs/passport';
import { UserService } from '../user/user.service';
import { LeaderboardService } from '../leaderboard/leaderboard.service';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('quiz')
export class QuizController {
  constructor(
    private readonly quizService: QuizService,
    private readonly userService: UserService,
    private readonly leaderboardService: LeaderboardService,
  ) {}

  @Get('available-movies')
  async getAvailableMovies() {
    return this.quizService.getMoviesWithQuizzes();
  }

  // --- NEW: ADMIN GET ALL QUESTIONS ---
  @Get('all')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  async getAllQuizzes() {
    return this.quizService.findAll();
  }

  @Get(':imdbID')
  @UseGuards(AuthGuard('jwt'))
  async getQuiz(
    @Param('imdbID') imdbID: string,
    @Request() req,
  ): Promise<any[]> {
    const hasTaken = await this.userService.hasUserCompletedQuiz(
      req.user.userId,
      imdbID,
    );

    if (hasTaken) {
      throw new ForbiddenException('You have already completed this quiz.');
    }

    const questions = await this.quizService.findQuizByImdbID(imdbID);
    if (!questions || questions.length === 0) {
      throw new NotFoundException(`No quiz found for movie ID ${imdbID}`);
    }
    return questions;
  }

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  async create(@Body() quiz: CreateQuizDto): Promise<Quiz> {
    return this.quizService.createQuiz(quiz as Quiz);
  }

  // Verify a single answer for instant feedback without exposing all answers.
  @Post('check')
  @UseGuards(AuthGuard('jwt'))
  async checkAnswer(@Body() body: CheckAnswerDto) {
    return this.quizService.checkAnswer(body.questionId, body.selectedAnswer);
  }

  @Post('submit')
  @UseGuards(AuthGuard('jwt'))
  async submitQuiz(
    @Body()
    body: SubmitQuizDto,
    @Request() req,
  ): Promise<{
    score: number;
    totalQuestions: number;
    correctCount: number;
    rank: number;
  }> {
    const { imdbID, answers, movieTitle, timeTaken } = body;

    const hasTaken = await this.userService.hasUserCompletedQuiz(
      req.user.userId,
      imdbID,
    );
    if (hasTaken) {
      throw new ForbiddenException('Quiz already recorded.');
    }

    const score = await this.quizService.calculateScore(answers);
    const correctCount = score / 10;
    const totalQuestions = answers.length;

    // These two writes are independent, so run them together.
    await Promise.all([
      this.userService.addQuizResult(req.user.userId, {
        imdbID,
        score,
        movieTitle,
        timeTaken,
      }),
      this.leaderboardService.create({
        userId: req.user.userId,
        username: req.user.username,
        score: score,
        imdbID: imdbID,
        movieTitle: movieTitle,
        timeTaken: timeTaken,
        date: new Date(),
      } as any),
    ]);

    const rank = await this.leaderboardService.calculateRank(score, timeTaken);

    return { score, totalQuestions, correctCount, rank };
  }

  @Put(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  async update(
    @Param('id') id: string,
    @Body() quiz: Partial<Quiz>,
  ): Promise<Quiz> {
    const updatedQuiz = await this.quizService.updateQuiz(id, quiz);
    if (!updatedQuiz) {
      throw new NotFoundException(`Quiz with ID ${id} not found`);
    }
    return updatedQuiz;
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  async remove(@Param('id') id: string): Promise<Quiz> {
    const deletedQuiz = await this.quizService.removeQuiz(id);
    if (!deletedQuiz) {
      throw new NotFoundException(`Quiz with ID ${id} not found`);
    }
    return deletedQuiz;
  }
}
