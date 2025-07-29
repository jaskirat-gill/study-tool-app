'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { getStudySet } from '@/lib/storage';
import { generateExamQuestions } from '@/lib/gemini-client';
import { StudySet, ExamQuestion } from '@/types';
import { ArrowLeft, Clock, CheckCircle, XCircle, RotateCcw } from 'lucide-react';

export default function PracticeExamPage() {
  const params = useParams();
  const router = useRouter();
  const studySetId = params.id as string;

  const [studySet, setStudySet] = useState<StudySet | null>(null);
  const [examQuestions, setExamQuestions] = useState<ExamQuestion[]>([]);
  const [questionCount, setQuestionCount] = useState([10]); // Default to 10 questions
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const set = getStudySet(studySetId);
    if (!set) {
      router.push('/study-sets');
      return;
    }
    setStudySet(set);
  }, [studySetId, router]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (startTime && !showResults) {
      interval = setInterval(() => {
        setTimeElapsed(Math.floor((Date.now() - startTime.getTime()) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [startTime, showResults]);

  const generateExam = async () => {
    if (!studySet) return;

    setIsGenerating(true);
    setError(null);

    try {
      // Extract content from flashcards
      const content = studySet.flashcards
        .map(card => `Q: ${card.front}\nA: ${card.back}`)
        .join('\n\n');

      const result = await generateExamQuestions(content, questionCount[0]);
      
      if (result.error) {
        setError(result.error);
        return;
      }

      if (result.examQuestions) {
        setExamQuestions(result.examQuestions);
        setSelectedAnswers(new Array(result.examQuestions.length).fill(-1));
        setCurrentQuestionIndex(0);
        setShowResults(false);
        setStartTime(new Date());
        setTimeElapsed(0);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate exam');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAnswerSelect = (answerIndex: number) => {
    const newAnswers = [...selectedAnswers];
    newAnswers[currentQuestionIndex] = answerIndex;
    setSelectedAnswers(newAnswers);
  };

  const goToNextQuestion = () => {
    if (currentQuestionIndex < examQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const goToPreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const submitExam = () => {
    setShowResults(true);
  };

  const resetExam = () => {
    setExamQuestions([]);
    setSelectedAnswers([]);
    setCurrentQuestionIndex(0);
    setShowResults(false);
    setStartTime(null);
    setTimeElapsed(0);
    setError(null);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const calculateScore = () => {
    let correct = 0;
    examQuestions.forEach((question, index) => {
      if (selectedAnswers[index] === question.correctAnswer) {
        correct++;
      }
    });
    return { correct, total: examQuestions.length, percentage: (correct / examQuestions.length) * 100 };
  };

  if (!studySet) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <p>Loading study set...</p>
        </div>
      </div>
    );
  }

  if (examQuestions.length === 0) {
    return (
      <div className="container mx-auto py-8">
        <div className="max-w-2xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>

          <Card>
            <CardHeader>
              <CardTitle>Practice Exam: {studySet.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Generate a practice exam with multiple-choice questions based on your flashcards.
                This will help you test your knowledge in an exam-like format.
              </p>
              
              <div className="space-y-2">
                <p><strong>Number of flashcards:</strong> {studySet.flashcards.length}</p>
                <p><strong>Question types:</strong> Multiple choice with explanations</p>
              </div>

              {/* Question Count Slider */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="question-count">Number of Questions</Label>
                  <Badge variant="outline" className="text-sm">
                    {questionCount[0]} questions
                  </Badge>
                </div>
                <div className="px-3">
                  <Slider
                    id="question-count"
                    min={5}
                    max={25}
                    step={1}
                    value={questionCount}
                    onValueChange={setQuestionCount}
                    className="w-full"
                    disabled={isGenerating}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>5 questions</span>
                    <span>15 questions</span>
                    <span>25 questions</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  More questions provide a more comprehensive assessment but take longer to complete.
                </p>
              </div>

              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-800">{error}</p>
                </div>
              )}

              <Button 
                onClick={generateExam} 
                disabled={isGenerating || studySet.flashcards.length === 0}
                className="w-full"
              >
                {isGenerating ? 'Generating Exam...' : 'Generate Practice Exam'}
              </Button>

              {studySet.flashcards.length === 0 && (
                <p className="text-sm text-muted-foreground text-center">
                  This study set has no flashcards. Add some flashcards first.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (showResults) {
    const score = calculateScore();
    return (
      <div className="container mx-auto py-8">
        <div className="max-w-4xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Study Set
          </Button>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Exam Results
                <Badge variant={score.percentage >= 70 ? "default" : "destructive"}>
                  {score.percentage.toFixed(1)}%
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{score.correct}</p>
                  <p className="text-sm text-muted-foreground">Correct</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-red-600">{score.total - score.correct}</p>
                  <p className="text-sm text-muted-foreground">Incorrect</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{formatTime(timeElapsed)}</p>
                  <p className="text-sm text-muted-foreground">Time Taken</p>
                </div>
              </div>

              <div className="flex gap-2 justify-center">
                <Button onClick={resetExam} variant="outline">
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Retake Exam
                </Button>
                <Button onClick={() => router.back()}>
                  Back to Study Set
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Question Review */}
          <div className="space-y-4">
            {examQuestions.map((question, index) => {
              const userAnswer = selectedAnswers[index];
              const isCorrect = userAnswer === question.correctAnswer;
              
              return (
                <Card key={question.id} className="border-l-4" style={{
                  borderLeftColor: isCorrect ? '#10b981' : '#ef4444'
                }}>
                  <CardHeader>
                    <CardTitle className="flex items-start justify-between text-base">
                      <span>Question {index + 1}: {question.question}</span>
                      {isCorrect ? (
                        <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {question.options.map((option, optionIndex) => {
                        let className = "p-3 rounded border ";
                        if (optionIndex === question.correctAnswer) {
                          className += "bg-green-50 border-green-200 text-green-800";
                        } else if (optionIndex === userAnswer && userAnswer !== question.correctAnswer) {
                          className += "bg-red-50 border-red-200 text-red-800";
                        } else {
                          className += "bg-gray-50 border-gray-200";
                        }

                        return (
                          <div key={optionIndex} className={className}>
                            <div className="flex items-center justify-between">
                              <span>{option}</span>
                              {optionIndex === question.correctAnswer && (
                                <Badge variant="outline" className="bg-green-100 text-green-800">
                                  Correct
                                </Badge>
                              )}
                              {optionIndex === userAnswer && userAnswer !== question.correctAnswer && (
                                <Badge variant="outline" className="bg-red-100 text-red-800">
                                  Your Answer
                                </Badge>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    
                    {question.explanation && (
                      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
                        <p className="text-sm font-medium text-blue-800 mb-1">Explanation:</p>
                        <p className="text-sm text-blue-700">{question.explanation}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = examQuestions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / examQuestions.length) * 100;
  const answeredQuestions = selectedAnswers.filter(answer => answer !== -1).length;

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-4xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        {/* Progress Header */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <span className="font-mono text-lg">{formatTime(timeElapsed)}</span>
              </div>
              <div className="text-sm text-muted-foreground">
                Question {currentQuestionIndex + 1} of {examQuestions.length}
              </div>
            </div>
            <Progress value={progress} className="w-full" />
            <div className="flex justify-between text-sm text-muted-foreground mt-2">
              <span>Progress: {Math.round(progress)}%</span>
              <span>Answered: {answeredQuestions}/{examQuestions.length}</span>
            </div>
          </CardContent>
        </Card>

        {/* Question Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Question {currentQuestionIndex + 1}</span>
              <Badge variant="outline">
                {currentQuestion.difficulty}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg mb-6">{currentQuestion.question}</p>
            
            <div className="space-y-3">
              {currentQuestion.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleAnswerSelect(index)}
                  className={`w-full p-4 text-left rounded-lg border-2 transition-colors ${
                    selectedAnswers[currentQuestionIndex] === index
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center">
                    <span className="w-6 h-6 rounded-full border-2 border-current flex-shrink-0 mr-3 flex items-center justify-center text-sm font-medium">
                      {String.fromCharCode(65 + index)}
                    </span>
                    <span>{option}</span>
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={goToPreviousQuestion}
            disabled={currentQuestionIndex === 0}
          >
            Previous
          </Button>
          
          <div className="flex gap-2">
            {currentQuestionIndex === examQuestions.length - 1 ? (
              <Button
                onClick={submitExam}
                disabled={answeredQuestions < examQuestions.length}
              >
                Submit Exam
              </Button>
            ) : (
              <Button
                onClick={goToNextQuestion}
                disabled={selectedAnswers[currentQuestionIndex] === -1}
              >
                Next
              </Button>
            )}
          </div>
        </div>

        {answeredQuestions < examQuestions.length && (
          <p className="text-sm text-muted-foreground text-center mt-4">
            Please answer all questions before submitting the exam.
          </p>
        )}
      </div>
    </div>
  );
}