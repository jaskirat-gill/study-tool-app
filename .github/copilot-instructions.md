# Copilot Instructions

<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

This is a Next.js application that transforms documents into AI-powered flashcards and practice exams using Google Gemini and LangChain.

## Architecture Overview

**Data Flow**: Document Upload → Text Extraction (API) → LangChain Chunking → Gemini AI Processing → Supabase Storage → Study Interface

**Key Components**:
- `/src/lib/langchain/` - LangChain integration with Gemini (chunking, prompts, parsers)
- `/src/lib/storage.ts` - Supabase CRUD operations with full TypeScript schemas
- `/src/contexts/AuthContext.tsx` - Supabase auth with session management
- `/src/app/api/` - Next.js API routes for document processing and AI generation
- `middleware.ts` - Supabase SSR authentication middleware

## Development Workflow

**Start Dev Server**: `npm run dev` (uses Turbopack for faster builds)
**Environment**: Requires `GEMINI_API_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Critical Patterns

**Document Processing**: Use `/api/process-document` → `/lib/langchain/document-processor.ts` for PDF/DOCX/TXT extraction
**AI Generation**: Always chunk large documents using `splitTextIntoDocuments()` and `distributeItemsAcrossChunks()` from `/lib/langchain/index.ts`
**Type Safety**: All AI responses use Zod schemas in `/lib/langchain/output-parsers.ts` (e.g., `flashcardsParser`, `examQuestionsParser`)
**Data Persistence**: Use `/lib/storage.ts` functions like `saveStudySet()`, `loadStudySetsByUser()` - all handle Supabase relations automatically
**Auth Flow**: Protected routes use `useAuth()` hook; middleware handles SSR auth on `/study-sets/*`, `/notes/*`, `/upload`

## LangChain Integration Specifics

**Text Chunking**: `RecursiveCharacterTextSplitter` with 10k chars, 200 overlap for optimal Gemini context
**Prompt Templates**: Use `ChatPromptTemplate.fromTemplate()` pattern in `/lib/langchain/gemini-client.ts`
**Error Handling**: All AI functions return `{ success: boolean, error?: string, data?: T }` format

## UI Component Patterns

**Shadcn UI**: Import from `/components/ui/` - use `Button`, `Card`, `Dialog`, `Progress` components consistently
**Loading States**: Use `LoadingSpinner` component with `loading` boolean states
**Auth Guards**: Wrap protected content with `NotLoggedInPrompt` component
**Navigation**: Use `Navigation` component with conditional rendering based on auth state

## Database Schema (Supabase)

**Key Tables**: `study_sets`, `flashcards`, `study_sessions`, `study_notes` with RLS enabled
**Relations**: Study sets → flashcards (1:many), users → study sets (1:many) via `user_id`
**Types**: Import from `/types/` - `StudySet`, `Flashcard`, `ExamQuestion` match database schema exactly
