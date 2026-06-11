// src/quiz/quiz.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Quiz, QuizDocument } from './quiz.schema';

@Injectable()
export class QuizService {
  constructor(@InjectModel(Quiz.name) private quizModel: Model<QuizDocument>) {}

  // 1. Create Quiz
  async createQuiz(quizData: Quiz): Promise<QuizDocument> {
    const correctAnswerText = quizData.choices[quizData.correctIndex];
    // Shuffle choices upon creation so they are stored randomly,
    // BUT we must track where the correct answer went.
    const shuffledChoices = this.shuffleArray(quizData.choices);
    const newCorrectIndex = shuffledChoices.indexOf(correctAnswerText);

    const createdQuiz = new this.quizModel({
      ...quizData,
      choices: shuffledChoices,
      correctIndex: newCorrectIndex,
    });

    return createdQuiz.save();
  }

  // 2. Find All (Raw Data for Admin Dashboard)
  async findAll(): Promise<QuizDocument[]> {
    return this.quizModel.find().sort({ _id: -1 }).exec(); // Newest first
  }

  // 3. Find Quiz by Movie ID (For Users - Shuffled)
  async findQuizByImdbID(imdbID: string): Promise<any[]> {
    const questions = await this.quizModel.find({ imdbID }).lean().exec();

    if (!questions) return [];

    const dynamicQuestions = questions.map((q) => {
      const shuffledChoices = this.shuffleArray([...q.choices]);

      // Note: correctIndex is intentionally NOT returned so the answer
      // cannot be read from the network response. Correctness is checked
      // server-side via checkAnswer() and re-scored on submit.
      return {
        _id: q._id,
        imdbID: q.imdbID,
        questionText: q.questionText,
        choices: shuffledChoices,
      };
    });

    return this.shuffleArray(dynamicQuestions);
  }

  // Verify a single answer server-side (used for instant per-question feedback).
  async checkAnswer(
    questionId: string,
    selectedAnswer: string,
  ): Promise<{ correct: boolean; correctAnswer: string }> {
    const question = await this.quizModel.findById(questionId).lean().exec();
    if (!question) {
      throw new NotFoundException('Question not found');
    }
    const correctAnswer = question.choices[question.correctIndex];
    return { correct: correctAnswer === selectedAnswer, correctAnswer };
  }

  // 4. Calculate Score
  async calculateScore(
    submissions: { questionId: string; selectedAnswer: string }[],
  ): Promise<number> {
    const questionIds = submissions.map((sub) => sub.questionId);
    const questions = await this.quizModel
      .find({ _id: { $in: questionIds } })
      .lean()
      .exec();

    const questionMap = new Map<string, any>(
      questions.map((q) => [String(q._id), q]),
    );

    let score = 0;
    for (const sub of submissions) {
      const question = questionMap.get(sub.questionId);
      if (question) {
        const dbCorrectAnswer = question.choices[question.correctIndex];
        if (dbCorrectAnswer === sub.selectedAnswer) {
          score += 10;
        }
      }
    }
    return score;
  }

  // 5. Update Quiz
  async updateQuiz(
    id: string,
    quizData: Partial<Quiz>,
  ): Promise<QuizDocument | null> {
    // If choices changed, we might want to handle re-shuffling logic here
    // or trust the admin sent the correct index relative to the sent choices.
    // For simplicity, we trust the admin form data matches.
    return this.quizModel.findByIdAndUpdate(id, quizData, { new: true }).exec();
  }

  // 6. Delete Quiz
  async removeQuiz(id: string): Promise<QuizDocument | null> {
    return this.quizModel.findByIdAndDelete(id).exec();
  }

  async getMoviesWithQuizzes(): Promise<string[]> {
    return this.quizModel.distinct('imdbID').exec();
  }

  // Helper
  private shuffleArray<T>(array: T[]): T[] {
    const newArr = [...array];
    for (let i = newArr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
    }
    return newArr;
  }
}
