import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Quiz, QuizDocument } from './quiz.schema';

@Injectable()
export class QuizService {
  constructor(@InjectModel(Quiz.name) private quizModel: Model<QuizDocument>) {}

  /**
   * Creates a quiz and randomizes the order of choices.
   * Updates the correctIndex to ensure the answer remains valid.
   */
  async createQuiz(quizData: Quiz): Promise<QuizDocument> {
    // 1. Identify the text of the correct answer using your schema's 'choices'
    const correctAnswerText = quizData.choices[quizData.correctIndex];

    // 2. Shuffle the choices array using Fisher-Yates
    const shuffledChoices = this.shuffleArray(quizData.choices);

    // 3. Update the correctIndex based on the new position in 'shuffledChoices'
    const newCorrectIndex = shuffledChoices.indexOf(correctAnswerText);

    // 4. Save with the randomized data
    const createdQuiz = new this.quizModel({
      ...quizData,
      choices: shuffledChoices,
      correctIndex: newCorrectIndex,
    });

    return createdQuiz.save();
  }

  /**
   * Retrieves and shuffles the order of the questions for a specific movie.
   */
  async findQuizByImdbID(imdbID: string): Promise<QuizDocument[]> {
    const questions = await this.quizModel.find({ imdbID }).exec();
    // Shuffles which question comes first, second, etc.
    return this.shuffleArray(questions);
  }

  async updateQuiz(
    id: string,
    quizData: Partial<Quiz>,
  ): Promise<QuizDocument | null> {
    return this.quizModel.findByIdAndUpdate(id, quizData, { new: true }).exec();
  }

  async removeQuiz(id: string): Promise<QuizDocument | null> {
    return this.quizModel.findByIdAndDelete(id).exec();
  }

  async getMoviesWithQuizzes(): Promise<string[]> {
    return this.quizModel.distinct('imdbID').exec();
  }

  /**
   * Helper: Fisher–Yates shuffle algorithm
   */
  private shuffleArray<T>(array: T[]): T[] {
    const newArr = [...array];
    for (let i = newArr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
    }
    return newArr;
  }

  /**
   * Calculates score based on your schema's correctIndex
   */
  async calculateScore(
    submissions: { questionId: string; selectedIndex: number }[],
  ): Promise<number> {
    const questionIds = submissions.map((sub) => sub.questionId);
    const questions = await this.quizModel
      .find({ _id: { $in: questionIds } })
      .exec();

    // --- FIX: Cast q._id to string or access via .id ---
    const questionMap = new Map<string, QuizDocument>(
      questions.map((q) => [String(q._id), q]),
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
