-- Study Tool Database Schema for Supabase
-- Run this SQL in your Supabase SQL Editor

-- Enable RLS (Row Level Security)
ALTER TABLE IF EXISTS public.study_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.study_notes ENABLE ROW LEVEL SECURITY;

-- Drop existing tables if they exist (for clean setup)
DROP TABLE IF EXISTS public.study_sessions CASCADE;
DROP TABLE IF EXISTS public.flashcards CASCADE;
DROP TABLE IF EXISTS public.study_sets CASCADE;
DROP TABLE IF EXISTS public.study_notes CASCADE;

-- Create study_sets table
CREATE TABLE public.study_sets (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    created TIMESTAMPTZ DEFAULT NOW(),
    last_modified TIMESTAMPTZ DEFAULT NOW(),
    source_document_name TEXT,
    source_document_type TEXT,
    source_document_size BIGINT
);

-- Create flashcards table
CREATE TABLE public.flashcards (
    id TEXT PRIMARY KEY,
    study_set_id TEXT REFERENCES public.study_sets(id) ON DELETE CASCADE,
    front TEXT NOT NULL,
    back TEXT NOT NULL,
    difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')) DEFAULT 'medium',
    created TIMESTAMPTZ DEFAULT NOW(),
    last_reviewed TIMESTAMPTZ,
    review_count INTEGER DEFAULT 0,
    correct_count INTEGER DEFAULT 0
);

-- Create study_sessions table
CREATE TABLE public.study_sessions (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    study_set_id TEXT REFERENCES public.study_sets(id) ON DELETE CASCADE,
    start_time TIMESTAMPTZ DEFAULT NOW(),
    end_time TIMESTAMPTZ,
    flashcards_reviewed INTEGER DEFAULT 0,
    correct_answers INTEGER DEFAULT 0,
    completed_flashcards TEXT[] DEFAULT '{}'
);

-- Create study_notes table
CREATE TABLE public.study_notes (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    created TIMESTAMPTZ DEFAULT NOW(),
    last_modified TIMESTAMPTZ DEFAULT NOW(),
    source_content TEXT
);

-- Create indexes for better performance
CREATE INDEX idx_study_sets_user_id ON public.study_sets(user_id);
CREATE INDEX idx_flashcards_study_set_id ON public.flashcards(study_set_id);
CREATE INDEX idx_study_sessions_user_id ON public.study_sessions(user_id);
CREATE INDEX idx_study_sessions_study_set_id ON public.study_sessions(study_set_id);
CREATE INDEX idx_study_notes_user_id ON public.study_notes(user_id);

-- Create RLS policies for study_sets
CREATE POLICY "Users can view their own study sets" ON public.study_sets
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own study sets" ON public.study_sets
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own study sets" ON public.study_sets
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own study sets" ON public.study_sets
    FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for flashcards
CREATE POLICY "Users can view flashcards of their study sets" ON public.flashcards
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.study_sets 
            WHERE study_sets.id = flashcards.study_set_id 
            AND study_sets.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert flashcards to their study sets" ON public.flashcards
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.study_sets 
            WHERE study_sets.id = flashcards.study_set_id 
            AND study_sets.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update flashcards of their study sets" ON public.flashcards
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.study_sets 
            WHERE study_sets.id = flashcards.study_set_id 
            AND study_sets.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete flashcards of their study sets" ON public.flashcards
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.study_sets 
            WHERE study_sets.id = flashcards.study_set_id 
            AND study_sets.user_id = auth.uid()
        )
    );

-- Create RLS policies for study_sessions
CREATE POLICY "Users can view their own study sessions" ON public.study_sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own study sessions" ON public.study_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own study sessions" ON public.study_sessions
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own study sessions" ON public.study_sessions
    FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for study_notes
CREATE POLICY "Users can view their own study notes" ON public.study_notes
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own study notes" ON public.study_notes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own study notes" ON public.study_notes
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own study notes" ON public.study_notes
    FOR DELETE USING (auth.uid() = user_id);

-- Create a function to update last_modified timestamp
CREATE OR REPLACE FUNCTION update_last_modified()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_modified = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to auto-update last_modified
CREATE TRIGGER update_study_sets_last_modified
    BEFORE UPDATE ON public.study_sets
    FOR EACH ROW
    EXECUTE FUNCTION update_last_modified();

CREATE TRIGGER update_study_notes_last_modified
    BEFORE UPDATE ON public.study_notes
    FOR EACH ROW
    EXECUTE FUNCTION update_last_modified();
