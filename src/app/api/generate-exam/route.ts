import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function POST(request: NextRequest) {
  try {
    const { content, count = 5 } = await request.json();

    if (!content || typeof content !== 'string') {
      return NextResponse.json(
        { error: 'Content is required and must be a string' },
        { status: 400 }
      );
    }

    const questionCount = Number(count) || 5;

    const prompt = `You are an expert educational content creator. Generate exactly ${questionCount} multiple choice exam questions from the following content. Each question should have exactly 4 options with one correct answer. Include an explanation for the correct answer. Vary the difficulty levels between "easy", "medium", and "hard".

Content:
${content}

Respond ONLY with valid JSON in this exact format (no other text before or after):
{
  "examQuestions": [
    {
      "question": "Question text here",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": 0,
      "explanation": "Explanation of correct answer here",
      "difficulty": "medium"
    }
  ]
}`;

    // Escape the prompt for shell execution
    const escapedPrompt = prompt.replace(/"/g, '\\"');
    const command = `gemini -p "${escapedPrompt}"`;

    // Execute the Gemini CLI command
    const result = await execAsync(command, {
      timeout: 60000, // 60 second timeout
      maxBuffer: 1024 * 1024 * 10, // 10MB buffer
    });

    let output = result.stdout.trim();

    // Remove any non-JSON content (like "Loaded cached credentials.")
    const jsonStart = output.indexOf('{');
    const jsonEnd = output.lastIndexOf('}');

    if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
      output = output.substring(jsonStart, jsonEnd + 1);
    }

    // Validate that we have valid JSON
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(output);
    } catch {
      throw new Error('Invalid JSON response from Gemini CLI');
    }

    // Add IDs to exam questions
    interface GeminiExamQuestion {
      question: string;
      options: string[];
      correctAnswer: number;
      explanation: string;
      difficulty: string;
    }
    
    const questionsWithIds = parsedResponse.examQuestions?.map((question: GeminiExamQuestion) => ({
      id: Math.random().toString(36).substr(2, 9) + Date.now().toString(36),
      question: question.question || '',
      options: question.options || [],
      correctAnswer: question.correctAnswer || 0,
      explanation: question.explanation || '',
      difficulty: question.difficulty || 'medium',
    })) || [];

    return NextResponse.json({ examQuestions: questionsWithIds });

  } catch (error) {
    console.error('Gemini CLI Error:', error);
    
    const { count = 5 } = await request.json().catch(() => ({ count: 5 }));
    const questionCount = Number(count) || 5;
    
    // Fallback to mock responses if CLI fails
    const mockQuestions = Array.from({ length: Math.min(questionCount, 10) }, (_, i) => ({
      id: Math.random().toString(36).substr(2, 9) + Date.now().toString(36),
      question: `Sample Question ${i + 1}: Which of the following concepts is discussed in the content?`,
      options: [
        `Concept A from the material`,
        `Concept B from the material`,
        `Concept C from the material`,
        `Concept D from the material`
      ],
      correctAnswer: i % 4,
      explanation: `This concept is explained in the provided content material.`,
      difficulty: ['easy', 'medium', 'hard'][i % 3] as 'easy' | 'medium' | 'hard',
    }));

    return NextResponse.json({ examQuestions: mockQuestions });
  }
}
