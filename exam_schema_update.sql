-- Update exam tables to use document uploads
-- Run this SQL in your Supabase SQL Editor

-- First enable RLS
ALTER TABLE IF EXISTS public.practice_exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.exam_questions ENABLE ROW LEVEL SECURITY;

-- Drop existing tables if they exist
DROP TABLE IF EXISTS public.exam_questions CASCADE;
DROP TABLE IF EXISTS public.practice_exams CASCADE;

-- Create practice_exams table
CREATE TABLE public.practice_exams (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    duration INTEGER DEFAULT 0,
    created TIMESTAMPTZ DEFAULT NOW(),
    document_id TEXT REFERENCES public.document_uploads(id) ON DELETE SET NULL
);

-- Create exam_questions table
CREATE TABLE public.exam_questions (
    id TEXT PRIMARY KEY,
    exam_id TEXT REFERENCES public.practice_exams(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    type TEXT CHECK (type IN ('multiple-choice', 'fill-in-blank', 'short-answer')),
    options JSONB,
    correct_answer TEXT,
    explanation TEXT,
    difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')) DEFAULT 'medium',
    manual_score REAL
);

-- Create indexes for better performance
CREATE INDEX idx_practice_exams_user_id ON public.practice_exams(user_id);
CREATE INDEX idx_practice_exams_document_id ON public.practice_exams(document_id);
CREATE INDEX idx_exam_questions_exam_id ON public.exam_questions(exam_id);

-- Create RLS policies for practice_exams
CREATE POLICY "Users can view their own practice exams" ON public.practice_exams
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own practice exams" ON public.practice_exams
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own practice exams" ON public.practice_exams
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own practice exams" ON public.practice_exams
    FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for exam_questions
CREATE POLICY "Users can view questions of their practice exams" ON public.exam_questions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.practice_exams 
            WHERE practice_exams.id = exam_questions.exam_id 
            AND practice_exams.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert questions to their practice exams" ON public.exam_questions
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.practice_exams 
            WHERE practice_exams.id = exam_questions.exam_id 
            AND practice_exams.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update questions of their practice exams" ON public.exam_questions
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.practice_exams 
            WHERE practice_exams.id = exam_questions.exam_id 
            AND practice_exams.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete questions of their practice exams" ON public.exam_questions
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.practice_exams 
            WHERE practice_exams.id = exam_questions.exam_id 
            AND practice_exams.user_id = auth.uid()
        )
    );
