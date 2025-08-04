'use client';

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { getPracticeExam, deletePracticeExam } from "@/lib/exam-storage";
import { PracticeExam } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "react-hot-toast";
import { 
  ArrowLeft, 
  Clock, 
  Check, 
  X, 
  AlertTriangle, 
  RotateCcw,
  Trash2, 
  CheckCircle,
  XCircle
} from "lucide-react";
import { motion } from "framer-motion";

export default function ExamDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const examId = params.id as string;

  const [exam, setExam] = useState<PracticeExam | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<(number | string)[]>([]);
  const [manualScores, setManualScores] = useState<{[key: number]: number}>({});
  const [isExamStarted, setIsExamStarted] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [showManualMarking, setShowManualMarking] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  useEffect(() => {
    if (!examId || !user) {
      router.push('/dashboard/exams');
      return;
    }

    const loadExam = async () => {
      try {
        setLoading(true);
        const examData = await getPracticeExam(examId, user);
        if (!examData) {
          setError("Exam not found");
          return;
        }
        setExam(examData);
        setSelectedAnswers(new Array(examData.questions.length).fill(''));
      } catch (err) {
        console.error('Error loading exam:', err);
        setError("Failed to load exam");
      } finally {
        setLoading(false);
      }
    };
    
    loadExam();
  }, [examId, router, user]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (startTime && isExamStarted && !showResults && !showManualMarking) {
      interval = setInterval(() => {
        setTimeElapsed(Math.floor((Date.now() - startTime.getTime()) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [startTime, isExamStarted, showResults, showManualMarking]);

  const startExam = () => {
    setIsExamStarted(true);
    setStartTime(new Date());
    setTimeElapsed(0);
    setCurrentQuestionIndex(0);
  };

  const handleAnswerSelect = (answerValue: number | string) => {
    const newAnswers = [...selectedAnswers];
    newAnswers[currentQuestionIndex] = answerValue;
    setSelectedAnswers(newAnswers);
  };

  const goToNextQuestion = () => {
    if (currentQuestionIndex < (exam?.questions.length || 0) - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const goToPreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const submitExam = () => {
    const score = calculateScore();
    if (score.needsManualMarking) {
      setShowManualMarking(true);
    } else {
      setShowResults(true);
    }
  };

  const handleManualScore = (questionIndex: number, score: number) => {
    setManualScores(prev => ({
      ...prev,
      [questionIndex]: score
    }));
  };

  const finishManualMarking = () => {
    setShowManualMarking(false);
    setShowResults(true);
  };

  const resetExam = () => {
    setSelectedAnswers(new Array(exam?.questions.length || 0).fill(''));
    setManualScores({});
    setCurrentQuestionIndex(0);
    setShowResults(false);
    setShowManualMarking(false);
    setIsExamStarted(false);
    setStartTime(null);
    setTimeElapsed(0);
  };

  const deleteExam = async () => {
    if (!exam || !user) return;
    
    try {
      await deletePracticeExam(exam.id, user);
      toast.success('Exam deleted successfully');
      router.push('/dashboard/exams');
    } catch (error) {
      console.error('Error deleting exam:', error);
      toast.error('Failed to delete exam');
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const calculateScore = useCallback(() => {
    if (!exam) return { correct: 0, total: 0, percentage: 0, needsManualMarking: false };
    
    let correct = 0;
    let total = 0;
    
    exam.questions.forEach((question, index) => {
      const userAnswer = selectedAnswers[index];
      
      if (question.type === 'multiple-choice') {
        total++;
        if (userAnswer === question.correctAnswer) {
          correct++;
        }
      } else {
        // For fill-in-blank and short-answer, only count if manually scored
        if (manualScores[index] !== undefined) {
          total++;
          if (manualScores[index] === 1) {
            correct++;
          }
        }
      }
    });
    
    return { 
      correct, 
      total, 
      percentage: total > 0 ? (correct / total) * 100 : 0,
      needsManualMarking: exam.questions.some((q, i) => 
        (q.type === 'fill-in-blank' || q.type === 'short-answer') && 
        selectedAnswers[i] && 
        manualScores[i] === undefined
      )
    };
  }, [exam, selectedAnswers, manualScores]);

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <p>Loading exam...</p>
        </div>
      </div>
    );
  }

  if (error || !exam) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <p className="text-red-500">{error || "Exam not found"}</p>
          <Button 
            onClick={() => router.push('/dashboard/exams')}
            className="mt-4"
          >
            Go Back to Exams
          </Button>
        </div>
      </div>
    );
  }

  if (!isExamStarted) {
    return (
      <div className="container mx-auto py-8">
        <div className="max-w-2xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => router.push('/dashboard/exams')}
            className="mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Exams
          </Button>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>{exam.title}</CardTitle>
                  <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <Trash2 className="h-5 w-5 text-red-500" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Delete Exam</DialogTitle>
                        <DialogDescription>
                          Are you sure you want to delete this exam? This action cannot be undone.
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button variant="destructive" onClick={deleteExam}>
                          Delete
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
                <CardDescription>
                  Created on {exam.created.toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <p className="text-sm text-blue-800 font-medium">Questions</p>
                    <p className="text-2xl font-bold">{exam.questions.length}</p>
                  </div>
                  {exam.duration > 0 && (
                    <div className="bg-purple-50 rounded-lg p-4">
                      <p className="text-sm text-purple-800 font-medium">Duration</p>
                      <p className="text-2xl font-bold">{exam.duration} minutes</p>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <h3 className="font-medium">Question Types:</h3>
                  <div className="flex flex-wrap gap-2">
                    {['multiple-choice', 'fill-in-blank', 'short-answer'].map(type => {
                      const count = exam.questions.filter(q => q.type === type).length;
                      if (count === 0) return null;
                      
                      return (
                        <Badge key={type} variant="secondary">
                          {type.replace('-', ' ')} ({count})
                        </Badge>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-4">
                  <Button 
                    onClick={startExam} 
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                    size="lg"
                  >
                    Start Exam
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    );
  }

  if (showManualMarking) {
    const questionsToMark = exam.questions
      .map((question, index) => ({ question, index }))
      .filter(({ question, index }) => 
        (question.type === 'fill-in-blank' || question.type === 'short-answer') && 
        selectedAnswers[index] && 
        manualScores[index] === undefined
      );

    const allMarked = questionsToMark.every(({ index }) => manualScores[index] !== undefined);

    return (
      <div className="container mx-auto py-8">
        <div className="max-w-4xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => setShowManualMarking(false)}
            className="mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Exam
          </Button>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Manual Marking Required</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Please review and mark the following fill-in-blank and short answer questions manually.
              </p>
              <div className="text-sm text-muted-foreground mb-6">
                Progress: {questionsToMark.length - questionsToMark.filter(({ index }) => manualScores[index] === undefined).length} of {questionsToMark.length} questions marked
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            {questionsToMark.map(({ question, index }) => {
              const userAnswer = selectedAnswers[index];
              const isMarked = manualScores[index] !== undefined;
              
              return (
                <Card key={question.id} className={`border-l-4 ${
                  isMarked 
                    ? (manualScores[index] === 1 ? 'border-l-green-500' : 'border-l-red-500')
                    : 'border-l-yellow-500'
                }`}>
                  <CardHeader>
                    <CardTitle className="text-base">Question {index + 1}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="font-medium mb-2">Question:</p>
                      <p>{question.question}</p>
                    </div>
                    
                    <div>
                      <p className="font-medium mb-2">Student&apos;s Answer:</p>
                      <p className="p-3 bg-gray-50 rounded-lg">{userAnswer}</p>
                    </div>
                    
                    {question.correctAnswer && (
                      <div>
                        <p className="font-medium mb-2">Correct Answer:</p>
                        <p className="p-3 bg-gray-50 rounded-lg">{question.correctAnswer}</p>
                      </div>
                    )}
                    
                    <div className="flex gap-2 justify-center pt-2">
                      <Button 
                        variant={manualScores[index] === 1 ? "default" : "outline"}
                        className={manualScores[index] === 1 ? "bg-green-600 hover:bg-green-700" : ""}
                        onClick={() => handleManualScore(index, 1)}
                      >
                        <Check className="h-4 w-4 mr-2" />
                        Correct
                      </Button>
                      <Button 
                        variant={manualScores[index] === 0 ? "default" : "outline"}
                        className={manualScores[index] === 0 ? "bg-red-600 hover:bg-red-700" : ""}
                        onClick={() => handleManualScore(index, 0)}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Incorrect
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <Card className="mt-6">
            <CardContent className="pt-6">
              <div className="flex justify-center">
                <Button
                  onClick={finishManualMarking}
                  disabled={!allMarked}
                  size="lg"
                >
                  {allMarked ? "Finish Marking & View Results" : `Mark ${questionsToMark.filter(({ index }) => manualScores[index] === undefined).length} More Questions`}
                </Button>
              </div>
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
            onClick={() => router.push('/dashboard/exams')}
            className="mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Exams
          </Button>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Exam Results
                <Badge variant={score.percentage >= 70 ? "default" : "destructive"}>
                  {Math.round(score.percentage)}%
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">{score.correct}</div>
                  <div className="text-sm text-muted-foreground">Correct Answers</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold">{score.total}</div>
                  <div className="text-sm text-muted-foreground">Total Questions</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold">{formatTime(timeElapsed)}</div>
                  <div className="text-sm text-muted-foreground">Time Elapsed</div>
                </div>
              </div>

              <div className="flex gap-2 justify-center">
                <Button onClick={resetExam} variant="outline">
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Retake Exam
                </Button>
                <Button onClick={() => router.push('/dashboard/exams')}>
                  Back to Exams
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Question Review */}
          <div className="space-y-4">
            {exam.questions.map((question, index) => {
              const userAnswer = selectedAnswers[index];
              let isCorrect = false;
              let wasAnswered = true;
              
              if (question.type === 'multiple-choice') {
                isCorrect = userAnswer === question.correctAnswer;
                wasAnswered = userAnswer !== '' && userAnswer !== undefined && userAnswer !== null;
              } else {
                // For fill-in-blank and short-answer, use manual scoring
                if (manualScores[index] !== undefined) {
                  isCorrect = manualScores[index] === 1;
                } else {
                  wasAnswered = userAnswer !== '' && userAnswer !== undefined && userAnswer !== null;
                  isCorrect = false;
                }
              }
              
              return (
                <Card key={question.id} className="border-l-4" style={{
                  borderLeftColor: !wasAnswered ? '#f59e0b' : (isCorrect ? '#10b981' : '#ef4444')
                }}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-base">Question {index + 1}</CardTitle>
                      <Badge variant={isCorrect ? "default" : (!wasAnswered ? "outline" : "destructive")}>
                        {!wasAnswered ? 'Unanswered' : (isCorrect ? 'Correct' : 'Incorrect')}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p>{question.question}</p>
                    
                    {question.type === 'multiple-choice' && question.options && (
                      <div className="space-y-2 ml-4">
                        {question.options.map((option, optIndex) => (
                          <div key={optIndex} className="flex items-center gap-2">
                            {optIndex === question.correctAnswer && optIndex === userAnswer ? (
                              <CheckCircle className="h-5 w-5 text-green-500" />
                            ) : optIndex === question.correctAnswer ? (
                              <CheckCircle className="h-5 w-5 text-green-500" />
                            ) : optIndex === userAnswer ? (
                              <XCircle className="h-5 w-5 text-red-500" />
                            ) : (
                              <div className="h-5 w-5 rounded-full border border-gray-300"></div>
                            )}
                            <span className={`${
                              optIndex === question.correctAnswer ? 'font-medium text-green-600' : 
                              (optIndex === userAnswer ? 'font-medium text-red-600' : '')
                            }`}>
                              {option}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {(question.type === 'fill-in-blank' || question.type === 'short-answer') && (
                      <div className="space-y-2">
                        <div>
                          <p className="text-sm font-medium text-gray-500">Your Answer:</p>
                          <p className="p-2 bg-gray-50 rounded">{userAnswer || '(No answer provided)'}</p>
                        </div>
                        
                        {question.correctAnswer && (
                          <div>
                            <p className="text-sm font-medium text-gray-500">Correct Answer:</p>
                            <p className="p-2 bg-gray-50 rounded">{question.correctAnswer}</p>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {question.explanation && (
                      <div className="mt-2 p-3 bg-blue-50 text-blue-800 rounded-lg">
                        <p className="text-sm font-medium mb-1">Explanation:</p>
                        <p className="text-sm">{question.explanation}</p>
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

  const currentQuestion = exam.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / exam.questions.length) * 100;
  const answeredQuestions = selectedAnswers.filter((answer, index) => {
    const questionType = exam.questions[index].type;
    
    if (questionType === 'multiple-choice') {
      // For multiple choice, answer is a number representing the selected option
      return typeof answer === 'number' && answer !== -1;
    } else if (questionType === 'fill-in-blank' || questionType === 'short-answer') {
      // For text-based answers, check if there's actual text content
      return answer !== '' && answer !== null && answer !== undefined && String(answer).trim() !== '';
    }
    return false;
  }).length;

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-4xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => router.push('/dashboard/exams')}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Exit Exam
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
                Question {currentQuestionIndex + 1} of {exam.questions.length}
              </div>
            </div>
            <Progress value={progress} className="w-full" />
            <div className="flex justify-between text-sm text-muted-foreground mt-2">
              <span>Progress: {Math.round(progress)}%</span>
              <span>Answered: {answeredQuestions}/{exam.questions.length}</span>
            </div>
          </CardContent>
        </Card>

        {/* Question Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Question {currentQuestionIndex + 1}</span>
              <div className="flex items-center gap-2">
                <Badge variant="outline">
                  {currentQuestion.type === 'multiple-choice'
                    ? 'Multiple Choice'
                    : currentQuestion.type === 'fill-in-blank'
                    ? 'Fill in the Blank'
                    : 'Short Answer'}
                </Badge>
                <Badge variant="outline">
                  {currentQuestion.difficulty || 'Medium'}
                </Badge>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg mb-6">{currentQuestion.question}</p>
            
            {currentQuestion.type === 'multiple-choice' && currentQuestion.options ? (
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
                    {option}
                  </button>
                ))}
              </div>
            ) : currentQuestion.type === 'fill-in-blank' ? (
              <div className="space-y-3">
                <Label htmlFor="answer-input">Fill in the missing word or phrase:</Label>
                <Input
                  id="answer-input"
                  type="text"
                  placeholder="Type your answer here..."
                  value={String(selectedAnswers[currentQuestionIndex] || '')}
                  onChange={(e) => handleAnswerSelect(e.target.value)}
                  className="w-full"
                />
              </div>
            ) : (
              <div className="space-y-3">
                <Label htmlFor="answer-textarea">Provide a short answer (1-2 sentences):</Label>
                <Textarea
                  id="answer-textarea"
                  placeholder="Type your answer here..."
                  value={String(selectedAnswers[currentQuestionIndex] || '')}
                  onChange={(e) => handleAnswerSelect(e.target.value)}
                  className="w-full min-h-[100px]"
                />
              </div>
            )}
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
            {currentQuestionIndex === exam.questions.length - 1 ? (
              <Button
                onClick={submitExam}
                disabled={answeredQuestions < exam.questions.length}
                className="bg-green-600 hover:bg-green-700"
              >
                Submit Exam
              </Button>
            ) : (
              <Button
                onClick={goToNextQuestion}
                disabled={
                  currentQuestion.type === 'multiple-choice' 
                    ? typeof selectedAnswers[currentQuestionIndex] !== 'number' || selectedAnswers[currentQuestionIndex] === -1
                    : !selectedAnswers[currentQuestionIndex] || String(selectedAnswers[currentQuestionIndex]).trim() === ''
                }
              >
                Next
              </Button>
            )}
          </div>
        </div>

        {answeredQuestions < exam.questions.length && currentQuestionIndex === exam.questions.length - 1 && (
          <div className="mt-4 p-3 bg-yellow-50 rounded-lg flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            <p className="text-sm text-yellow-700">
              Please answer all questions before submitting the exam.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
