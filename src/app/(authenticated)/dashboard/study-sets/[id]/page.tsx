'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  RotateCcw, 
  Check, 
  X, 
  ChevronLeft, 
  ChevronRight,
  BookOpen,
  Trophy
} from 'lucide-react';
import { getStudySet, saveStudySet } from '@/lib/storage';
import { StudySet } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import NotLoggedInPrompt from '@/components/NotLoggedInPrompt';

export default function StudySetPage() {
  const params = useParams();
  const router = useRouter();
  const [studySet, setStudySet] = useState<StudySet | null>(null);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [sessionStats, setSessionStats] = useState({
    correct: 0,
    incorrect: 0,
    total: 0,
  });
  const [completedCards, setCompletedCards] = useState<Set<string>>(new Set());
  const [showResults, setShowResults] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const loadStudySet = async () => {
      if (params.id) {
        try {
          const set = await getStudySet(params.id as string, user);
          if (set) {
            setStudySet(set);
            setSessionStats(prev => ({ ...prev, total: set.flashcards.length }));
          } else {
            router.push('/dashboard/study-sets');
          }
        } catch (error) {
          console.error('Error loading study set:', error);
          router.push('/dashboard/study-sets');
        }
      }
    };
    
    loadStudySet();
  }, [params.id, router, user]);

  if (!user) {
    return <NotLoggedInPrompt/>
  }
  const currentCard = studySet?.flashcards[currentCardIndex];

  const handleCardFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleAnswer = (isCorrect: boolean) => {
    if (!currentCard || !studySet) return;

    // Update card statistics
    const updatedFlashcards = studySet.flashcards.map(card => {
      if (card.id === currentCard.id) {
        return {
          ...card,
          reviewCount: card.reviewCount + 1,
          correctCount: isCorrect ? card.correctCount + 1 : card.correctCount,
          lastReviewed: new Date(),
        };
      }
      return card;
    });

    // Update study set
    const updatedStudySet = {
      ...studySet,
      flashcards: updatedFlashcards,
      lastModified: new Date(),
    };

    setStudySet(updatedStudySet);
    
    // Save study set asynchronously
    saveStudySet(updatedStudySet, user).catch(error => {
      console.error('Error saving study set:', error);
    });

    // Update session statistics
    setSessionStats(prev => ({
      ...prev,
      correct: isCorrect ? prev.correct + 1 : prev.correct,
      incorrect: isCorrect ? prev.incorrect : prev.incorrect + 1,
    }));

    // Mark card as completed
    setCompletedCards(prev => new Set(prev.add(currentCard.id)));

    // Move to next card or show results
    if (currentCardIndex < studySet.flashcards.length - 1) {
      setCurrentCardIndex(prev => prev + 1);
      setIsFlipped(false);
    } else {
      setShowResults(true);
    }
  };

  const handlePreviousCard = () => {
    if (currentCardIndex > 0) {
      setCurrentCardIndex(prev => prev - 1);
      setIsFlipped(false);
    }
  };

  const handleNextCard = () => {
    if (studySet && currentCardIndex < studySet.flashcards.length - 1) {
      setCurrentCardIndex(prev => prev + 1);
      setIsFlipped(false);
    }
  };

  const resetSession = () => {
    setCurrentCardIndex(0);
    setIsFlipped(false);
    setSessionStats({ correct: 0, incorrect: 0, total: studySet?.flashcards.length || 0 });
    setCompletedCards(new Set());
    setShowResults(false);
  };

  const getProgressPercentage = () => {
    if (!studySet) return 0;
    return Math.round((completedCards.size / studySet.flashcards.length) * 100);
  };

  const getAccuracyPercentage = () => {
    const totalAnswered = sessionStats.correct + sessionStats.incorrect;
    if (totalAnswered === 0) return 0;
    return Math.round((sessionStats.correct / totalAnswered) * 100);
  };

  if (!studySet) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-gray-600">Loading study set...</p>
        </div>
      </div>
    );
  }

  if (showResults) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/50 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="w-full max-w-2xl mx-auto text-center space-y-8"
        >
          <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto shadow-lg">
            <Trophy className="h-12 w-12" />
          </div>
          <div className="space-y-2">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent">Session Complete!</h1>
            <p className="text-lg text-gray-600">Great job studying <span className="font-semibold">{studySet.title}</span></p>
          </div>
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle>Session Results</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-green-600">{sessionStats.correct}</div>
                  <div className="text-sm text-gray-500">Correct</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-red-600">{sessionStats.incorrect}</div>
                  <div className="text-sm text-gray-500">Incorrect</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{getAccuracyPercentage()}%</div>
                  <div className="text-sm text-gray-500">Accuracy</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button onClick={resetSession} className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700">
              <RotateCcw className="mr-2 h-4 w-4" />
              Study Again
            </Button>
            <Button variant="outline" asChild className="border-blue-200 text-blue-700 hover:bg-blue-50">
              <Link href="/dashboard/study-sets">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Study Sets
              </Link>
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/50 pb-16">
      <section className="container mx-auto px-4 pt-10 pb-6 max-w-4xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8"
        >
          <Button variant="ghost" asChild className="w-fit">
            <Link href="/dashboard/study-sets">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Study Sets
            </Link>
          </Button>
          <div className="flex-1 text-center">
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent">
              {studySet.title}
            </h1>
            <p className="text-gray-500 mt-1 text-base">
              Card {currentCardIndex + 1} of {studySet.flashcards.length}
            </p>
          </div>
          <Button variant="outline" onClick={resetSession} className="w-fit border-blue-200 text-blue-700 hover:bg-blue-50">
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset
          </Button>
        </motion.div>

        {/* Progress */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="space-y-2 mb-6"
        >
          <div className="flex justify-between text-sm">
            <span>Progress: {getProgressPercentage()}%</span>
            <span>Accuracy: {getAccuracyPercentage()}%</span>
          </div>
          <Progress value={getProgressPercentage()} className="h-2 bg-blue-100" />
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8"
        >
          <Card className="shadow-sm">
            <CardContent className="pt-6 text-center">
              <div className="text-2xl font-bold text-green-600">{sessionStats.correct}</div>
              <p className="text-sm text-gray-500">Correct</p>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardContent className="pt-6 text-center">
              <div className="text-2xl font-bold text-red-600">{sessionStats.incorrect}</div>
              <p className="text-sm text-gray-500">Incorrect</p>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardContent className="pt-6 text-center">
              <div className="text-2xl font-bold">{completedCards.size}</div>
              <p className="text-sm text-gray-500">Completed</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Flashcard */}
        <AnimatePresence mode="wait">
          {currentCard && (
            <motion.div
              key={currentCard.id + isFlipped}
              initial={{ opacity: 0, y: 40, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -40, scale: 0.98 }}
              transition={{ duration: 0.4 }}
              className="flex justify-center mb-8"
            >
              <Card
                className="w-full max-w-2xl min-h-[300px] cursor-pointer hover:shadow-lg transition-shadow bg-gradient-to-br from-white via-blue-50/60 to-indigo-50/80 border-0"
                onClick={handleCardFlip}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <Badge
                      variant={
                        currentCard.difficulty === 'easy' ? 'secondary' :
                        currentCard.difficulty === 'medium' ? 'default' : 'destructive'
                      }
                      className="capitalize"
                    >
                      {currentCard.difficulty}
                    </Badge>
                    <div className="text-sm text-gray-400">Click to flip</div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-center min-h-[200px]">
                    <div className="text-center space-y-4">
                      <div className="text-sm text-gray-400 uppercase tracking-wide">
                        {isFlipped ? 'Answer' : 'Question'}
                      </div>
                      <div className="text-lg leading-relaxed">
                        {isFlipped ? currentCard.back : currentCard.front}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation and Answer Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8"
        >
          <Button
            variant="outline"
            onClick={handlePreviousCard}
            disabled={currentCardIndex === 0}
            className="w-full sm:w-auto"
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Previous
          </Button>

          {isFlipped && (
            <div className="flex space-x-4 w-full sm:w-auto justify-center">
              <Button
                variant="outline"
                onClick={() => handleAnswer(false)}
                className="border-red-200 text-red-600 hover:bg-red-50"
              >
                <X className="mr-2 h-4 w-4" />
                Incorrect
              </Button>
              <Button
                onClick={() => handleAnswer(true)}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Check className="mr-2 h-4 w-4" />
                Correct
              </Button>
            </div>
          )}

          <Button
            variant="outline"
            onClick={handleNextCard}
            disabled={!studySet || currentCardIndex >= studySet.flashcards.length - 1}
            className="w-full sm:w-auto"
          >
            Next
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </motion.div>

        {/* Study Set Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center">
                <BookOpen className="mr-2 h-5 w-5" />
                Study Set Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Total Cards:</span> {studySet.flashcards.length}
                </div>
                <div>
                  <span className="font-medium">Created:</span> {new Date(studySet.created).toLocaleDateString()}
                </div>
                {studySet.description && (
                  <div className="md:col-span-2">
                    <span className="font-medium">Description:</span> {studySet.description}
                  </div>
                )}
                {studySet.sourceDocument && (
                  <div className="md:col-span-2">
                    <span className="font-medium">Source:</span> {studySet.sourceDocument.name}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </section>
    </div>
  );
}
