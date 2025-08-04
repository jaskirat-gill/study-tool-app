import { PracticeExam, User } from '@/types';
import { supabase } from './supabase/client';

// Save or update a practice exam
export async function savePracticeExam(exam: PracticeExam, user: User): Promise<void> {
  try {
    // First, save or update the exam
    const examData = {
      id: exam.id,
      user_id: user.id,
      title: exam.title,
      duration: exam.duration,
      created: new Date(exam.created).toISOString(),
      document_id: exam.studySetId // Use studySetId field but map to document_id
    };

    const { error: examError } = await supabase
      .from('practice_exams')
      .upsert(examData);
    
    if (examError) {
      console.error('Error saving practice exam:', examError);
      throw examError;
    }

    // Delete existing questions for this exam
    const { error: deleteError } = await supabase
      .from('exam_questions')
      .delete()
      .eq('exam_id', exam.id);

    if (deleteError) {
      console.error('Error deleting existing questions:', deleteError);
      throw deleteError;
    }

    // Insert new questions
    if (exam.questions.length > 0) {
      const questionsData = exam.questions.map(question => ({
        id: question.id,
        exam_id: exam.id,
        question: question.question,
        type: question.type,
        options: question.options ? JSON.stringify(question.options) : null,
        correct_answer: question.correctAnswer 
          ? typeof question.correctAnswer === 'number' 
            ? question.correctAnswer.toString() 
            : question.correctAnswer
          : null,
        explanation: question.explanation || null,
        difficulty: question.difficulty,
        manual_score: question.manualScore
      }));

      const { error: questionsError } = await supabase
        .from('exam_questions')
        .insert(questionsData);

      if (questionsError) {
        console.error('Error inserting questions:', questionsError);
        throw questionsError;
      }
    }
  } catch (error) {
    console.error('Error saving practice exam:', error);
    throw error;
  }
}

// Get all practice exams for a user
export async function getPracticeExams(user: User): Promise<PracticeExam[]> {
  try {
    const { data: exams, error: examsError } = await supabase
      .from('practice_exams')
      .select(`
        *,
        exam_questions (*)
      `)
      .eq('user_id', user.id)
      .order('created', { ascending: false });

    if (examsError) {
      throw examsError;
    }

    type DBExamQuestion = {
      id: string;
      question: string;
      type: 'multiple-choice' | 'fill-in-blank' | 'short-answer';
      options?: string | null;
      correct_answer?: string | null;
      explanation?: string | null;
      difficulty?: string | null;
      manual_score?: number | null;
    };

    type DBExam = {
      id: string;
      title: string;
      duration: number;
      created: string;
      document_id: string;
      exam_questions: DBExamQuestion[];
    };

    return (exams as DBExam[]).map((exam) => ({
      id: exam.id,
      title: exam.title,
      duration: exam.duration,
      created: new Date(exam.created),
      studySetId: exam.document_id, // Map from document_id to studySetId
      questions: exam.exam_questions.map((q) => {
        // Ensure difficulty is one of the allowed values
        const allowedDifficulties = ['easy', 'medium', 'hard'] as const;
        const rawDifficulty = (q.difficulty ?? '').toLowerCase();
        const isAllowedDifficulty = (d: string): d is 'easy' | 'medium' | 'hard' =>
          allowedDifficulties.includes(d as 'easy' | 'medium' | 'hard');
        const difficulty: 'easy' | 'medium' | 'hard' = isAllowedDifficulty(rawDifficulty)
          ? rawDifficulty as 'easy' | 'medium' | 'hard'
          : 'medium';
        return {
          id: q.id,
          question: q.question,
          type: q.type,
          options: q.options ? JSON.parse(q.options) as string[] : undefined,
          correctAnswer: q.correct_answer !== null 
            ? q.type === 'multiple-choice' 
              ? parseInt(q.correct_answer as string) 
              : q.correct_answer
            : undefined,
          explanation: q.explanation ?? undefined,
          difficulty,
          manualScore: q.manual_score ?? undefined
        };
      })
    }));
  } catch (error) {
    console.error('Error loading practice exams:', error);
    return [];
  }
}

// Get a single practice exam by ID
export async function getPracticeExam(id: string, user: User): Promise<PracticeExam | null> {
  try {
    const { data: exam, error } = await supabase
      .from('practice_exams')
      .select(`
        *,
        exam_questions (*)
      `)
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }

    type DBExamQuestion = {
      id: string;
      question: string;
      type: 'multiple-choice' | 'fill-in-blank' | 'short-answer';
      options?: string | null;
      correct_answer?: string | null;
      explanation?: string | null;
      difficulty?: string | null;
      manual_score?: number | null;
    };

    type DBExam = {
      id: string;
      title: string;
      duration: number;
      created: string;
      document_id: string;
      exam_questions: DBExamQuestion[];
    };

    const dbExam = exam as DBExam;
    return {
      id: dbExam.id,
      title: dbExam.title,
      duration: dbExam.duration,
      created: new Date(dbExam.created),
      studySetId: dbExam.document_id, // Map from document_id to studySetId
      questions: dbExam.exam_questions.map((q) => {
        const allowedDifficulties = ['easy', 'medium', 'hard'] as const;
        const rawDifficulty = (q.difficulty ?? '').toLowerCase();
        const isAllowedDifficulty = (d: string): d is 'easy' | 'medium' | 'hard' =>
          allowedDifficulties.includes(d as 'easy' | 'medium' | 'hard');
        const difficulty: 'easy' | 'medium' | 'hard' = isAllowedDifficulty(rawDifficulty)
          ? rawDifficulty as 'easy' | 'medium' | 'hard'
          : 'medium';
        return {
          id: q.id,
          question: q.question,
          type: q.type,
          options: q.options ? JSON.parse(q.options) as string[] : undefined,
          correctAnswer: q.correct_answer !== null 
            ? q.type === 'multiple-choice' 
              ? parseInt(q.correct_answer as string) 
              : q.correct_answer
            : undefined,
          explanation: q.explanation ?? undefined,
          difficulty,
          manualScore: q.manual_score ?? undefined
        };
      })
    };
  } catch (error) {
    console.error('Error loading practice exam:', error);
    return null;
  }
}

// Delete a practice exam
export async function deletePracticeExam(id: string, user: User): Promise<void> {
  try {
    // Delete questions first due to foreign key constraint
    const { error: questionsError } = await supabase
      .from('exam_questions')
      .delete()
      .eq('exam_id', id);

    if (questionsError) {
      throw questionsError;
    }

    // Then delete the exam
    const { error: examError } = await supabase
      .from('practice_exams')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (examError) {
      throw examError;
    }
  } catch (error) {
    console.error('Error deleting practice exam:', error);
    throw error;
  }
}
