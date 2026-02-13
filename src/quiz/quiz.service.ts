// src/quiz/quiz.service.ts
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Quiz, QuizDocument } from './quiz.schema';

@Injectable()
export class QuizService {
  constructor(@InjectModel(Quiz.name) private quizModel: Model<QuizDocument>) {}

  // 1. Create Quiz (Keeps your original logic)
  async createQuiz(quizData: Quiz): Promise<QuizDocument> {
    const correctAnswerText = quizData.choices[quizData.correctIndex];
    const shuffledChoices = this.shuffleArray(quizData.choices);
    const newCorrectIndex = shuffledChoices.indexOf(correctAnswerText);

    const createdQuiz = new this.quizModel({
      ...quizData,
      choices: shuffledChoices,
      correctIndex: newCorrectIndex,
    });

    return createdQuiz.save();
  }

  // 2. Find Quiz (UPDATED: Added .lean() and console logs)
  async findQuizByImdbID(imdbID: string): Promise<any[]> {
    console.log(`Fetching and shuffling quiz for: ${imdbID}`);

    // .lean() converts Mongoose Documents to plain JS objects
    // This allows us to modify/shuffle them freely
    const questions = await this.quizModel.find({ imdbID }).lean().exec();

    if (!questions) return [];

    const dynamicQuestions = questions.map((q) => {
      // 1. Identify the actual answer string based on the stored index
      const originalCorrectAnswer = q.choices[q.correctIndex];

      // 2. Shuffle the choices for this specific user session
      const shuffledChoices = this.shuffleArray([...q.choices]);

      // 3. Find where the answer moved to
      const newCorrectIndex = shuffledChoices.indexOf(originalCorrectAnswer);

      return {
        _id: q._id,
        imdbID: q.imdbID,
        questionText: q.questionText,
        choices: shuffledChoices, // The shuffled array
        correctIndex: newCorrectIndex, // The new correct position
      };
    });

    // 4. Shuffle the order of the questions themselves
    return this.shuffleArray(dynamicQuestions);
  }

  // 3. Calculate Score (Matches Text)
  async calculateScore(
    submissions: { questionId: string; selectedAnswer: string }[],
  ): Promise<number> {
    const questionIds = submissions.map((sub) => sub.questionId);

    // Use .lean() here too for speed
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
        // Compare the TEXT the user sent vs the TEXT in the DB
        const dbCorrectAnswer = question.choices[question.correctIndex];

        if (dbCorrectAnswer === sub.selectedAnswer) {
          score += 10;
        }
      }
    }
    return score;
  }

  // ... (Keep updateQuiz, removeQuiz, getMoviesWithQuizzes as they were) ...
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
