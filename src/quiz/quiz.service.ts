// src/quiz/quiz.service.ts
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Quiz, QuizDocument } from './quiz.schema';

@Injectable()
export class QuizService {
  constructor(@InjectModel(Quiz.name) private quizModel: Model<QuizDocument>) {}

  async createQuiz(quizData: Quiz): Promise<Quiz> {
    const createdQuiz = new this.quizModel(quizData);
    return createdQuiz.save();
  }

  // Retrieve and randomize quiz questions for a given movie
  async findQuizByImdbID(imdbID: string): Promise<Quiz[]> {
    const questions = await this.quizModel.find({ imdbID }).exec();
    return this.shuffleArray(questions);
  }

  async updateQuiz(id: string, quizData: Partial<Quiz>): Promise<Quiz | null> {
    return this.quizModel.findByIdAndUpdate(id, quizData, { new: true }).exec();
  }

  async removeQuiz(id: string): Promise<Quiz | null> {
    return this.quizModel.findByIdAndDelete(id).exec();
  }

  // --- NEW: Get list of movies that have quizzes ---
  async getMoviesWithQuizzes(): Promise<string[]> {
    // Returns an array of unique imdbIDs from the quizzes collection
    return this.quizModel.distinct('imdbID').exec();
  }

  // Helper: Shuffle array (Fisher–Yates algorithm)
  private shuffleArray<T>(array: T[]): T[] {
    const newArr = array.slice();
    for (let i = newArr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
    }
    return newArr;
  }

  // Calculate score with a single database call
  async calculateScore(
    submissions: { questionId: string; selectedIndex: number }[],
  ): Promise<number> {
    const questionIds = submissions.map((sub) => sub.questionId);
    const questions = await this.quizModel
      .find({ _id: { $in: questionIds } })
      .exec();

    const questionMap = new Map(
      questions.map((q) => [(q as any)._id.toString(), q]),
    );

    let score = 0;
    for (const sub of submissions) {
      const question = questionMap.get(sub.questionId);
      if (question && question.correctIndex === sub.selectedIndex) {
        score += 10;
      }
    }
    return score;
  }
}
