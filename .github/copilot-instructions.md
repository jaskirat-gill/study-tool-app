# Copilot Instructions

<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

This is a Next.js application with TypeScript, Tailwind CSS, and Shadcn UI components for a document-to-flashcards study tool.

## Project Overview
- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Shadcn UI
- **AI Integration**: Gemini CLI (free tier) via subprocess calls

## Key Features
1. Document upload functionality (PDF, DOCX, TXT)
2. AI-powered flashcard generation from uploaded documents
3. Quizlet-style flashcard interface
4. Practice exam generation
5. Study progress tracking

## Architecture Guidelines
- Use App Router for file-based routing
- Implement server actions for document processing
- Use React Server Components where possible
- Store flashcards and study data in local storage or IndexedDB
- Use subprocess calls to interact with Gemini CLI for AI processing

## Code Style
- Use functional components with TypeScript
- Follow Next.js best practices for performance
- Use Shadcn UI components consistently
- Implement responsive design with Tailwind CSS
- Use proper error handling and loading states

## File Structure
- `/src/app` - App Router pages and layouts
- `/src/components` - React components
- `/src/lib` - Utility functions and AI integration
- `/src/types` - TypeScript type definitions
- `/public` - Static assets
