'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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
            router.push('/study-sets');
          }
        } catch (error) {
          console.error('Error loading study set:', error);
          router.push('/study-sets');
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
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p>Loading study set...</p>
        </div>
      </div>
    );
  }

  if (showResults) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="text-center space-y-6">
          <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
            <Trophy className="h-12 w-12" />
          </div>
          
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">Session Complete!</h1>
            <p className="text-muted-foreground">
              Great job studying {studySet.title}
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Session Results</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {sessionStats.correct}
                  </div>
                  <div className="text-sm text-muted-foreground">Correct</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-red-600">
                    {sessionStats.incorrect}
                  </div>
                  <div className="text-sm text-muted-foreground">Incorrect</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">
                    {getAccuracyPercentage()}%
                  </div>
                  <div className="text-sm text-muted-foreground">Accuracy</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex space-x-4 justify-center">
            <Button onClick={resetSession}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Study Again
            </Button>
            <Button variant="outline" asChild>
              <Link href="/study-sets">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Study Sets
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" asChild>
            <Link href="/study-sets">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Study Sets
            </Link>
          </Button>
          <div className="text-center">
            <h1 className="text-2xl font-bold">{studySet.title}</h1>
            <p className="text-muted-foreground">
              Card {currentCardIndex + 1} of {studySet.flashcards.length}
            </p>
          </div>
          <Button variant="outline" onClick={resetSession}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset
          </Button>
        </div>

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progress: {getProgressPercentage()}%</span>
            <span>Accuracy: {getAccuracyPercentage()}%</span>
          </div>
          <Progress value={getProgressPercentage()} />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-2xl font-bold text-green-600">
                {sessionStats.correct}
              </div>
              <p className="text-sm text-muted-foreground">Correct</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-2xl font-bold text-red-600">
                {sessionStats.incorrect}
              </div>
              <p className="text-sm text-muted-foreground">Incorrect</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-2xl font-bold">
                {completedCards.size}
              </div>
              <p className="text-sm text-muted-foreground">Completed</p>
            </CardContent>
          </Card>
        </div>

        {/* Flashcard */}
        {currentCard && (
          <div className="flex justify-center">
            <Card 
              className="w-full max-w-2xl min-h-[300px] cursor-pointer hover:shadow-lg transition-shadow"
              onClick={handleCardFlip}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Badge 
                    variant={
                      currentCard.difficulty === 'easy' ? 'secondary' :
                      currentCard.difficulty === 'medium' ? 'default' : 'destructive'
                    }
                  >
                    {currentCard.difficulty}
                  </Badge>
                  <div className="text-sm text-muted-foreground">
                    Click to flip
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center min-h-[200px]">
                  <div className="text-center space-y-4">
                    <div className="text-sm text-muted-foreground uppercase tracking-wide">
                      {isFlipped ? 'Answer' : 'Question'}
                    </div>
                    <div className="text-lg leading-relaxed">
                      {isFlipped ? currentCard.back : currentCard.front}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Navigation and Answer Buttons */}
        <div className="flex items-center justify-between">
          <Button 
            variant="outline" 
            onClick={handlePreviousCard}
            disabled={currentCardIndex === 0}
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Previous
          </Button>

          {isFlipped && (
            <div className="flex space-x-4">
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
                className="bg-green-600 hover:bg-green-700"
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
          >
            Next
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>

        {/* Study Set Info */}
        <Card>
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
      </div>
    </div>
  );
}
