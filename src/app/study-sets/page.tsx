'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  BookOpen, 
  Upload, 
  Search, 
  Calendar, 
  FileText,
  Trash2,
  Play
} from 'lucide-react';
import { getStudySets, deleteStudySet } from '@/lib/storage';
import { StudySet } from '@/types';

export default function StudySetsPage() {
  const [studySets, setStudySets] = useState<StudySet[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredSets, setFilteredSets] = useState<StudySet[]>([]);

  useEffect(() => {
    loadStudySets();
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = studySets.filter(set =>
        set.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        set.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredSets(filtered);
    } else {
      setFilteredSets(studySets);
    }
  }, [searchQuery, studySets]);

  const loadStudySets = async () => {
    try {
      const sets = await getStudySets();
      setStudySets(sets);
    } catch (error) {
      console.error('Error loading study sets:', error);
      setStudySets([]);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this study set?')) {
      try {
        await deleteStudySet(id);
        loadStudySets();
      } catch (error) {
        console.error('Error deleting study set:', error);
      }
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (studySets.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center space-y-6 py-12">
          <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto">
            <BookOpen className="h-12 w-12 text-muted-foreground" />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">No Study Sets Yet</h1>
            <p className="text-muted-foreground max-w-md mx-auto">
              Upload your first document to create AI-powered flashcards and start studying!
            </p>
          </div>
          <Button asChild size="lg">
            <Link href="/upload">
              <Upload className="mr-2 h-4 w-4" />
              Create Your First Study Set
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-3xl font-bold">Study Sets</h1>
            <p className="text-muted-foreground">
              Manage your AI-generated flashcard collections
            </p>
          </div>
          <Button asChild>
            <Link href="/upload">
              <Upload className="mr-2 h-4 w-4" />
              Create New Set
            </Link>
          </Button>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search study sets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Study Sets Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSets.map((studySet) => (
            <Card key={studySet.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1">
                    <CardTitle className="line-clamp-2">{studySet.title}</CardTitle>
                    {studySet.description && (
                      <CardDescription className="line-clamp-2">
                        {studySet.description}
                      </CardDescription>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(studySet.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Stats */}
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-1">
                      <BookOpen className="h-4 w-4 text-muted-foreground" />
                      <span>{studySet.flashcards.length} flashcards</span>
                    </div>
                    <div className="flex items-center space-x-1 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>{formatDate(studySet.created)}</span>
                    </div>
                  </div>

                  {/* Source Document */}
                  {studySet.sourceDocument && (
                    <div className="flex items-center space-x-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground truncate">
                        {studySet.sourceDocument.name}
                      </span>
                    </div>
                  )}

                  {/* Difficulty Distribution */}
                  <div className="flex space-x-1">
                    {['easy', 'medium', 'hard'].map((difficulty) => {
                      const count = studySet.flashcards.filter(
                        card => card.difficulty === difficulty
                      ).length;
                      if (count === 0) return null;
                      
                      return (
                        <Badge
                          key={difficulty}
                          variant={
                            difficulty === 'easy' ? 'secondary' :
                            difficulty === 'medium' ? 'default' : 'destructive'
                          }
                          className="text-xs"
                        >
                          {count} {difficulty}
                        </Badge>
                      );
                    })}
                  </div>

                  {/* Actions */}
                  <div className="flex space-x-2">
                    <Button asChild size="sm" className="flex-1">
                      <Link href={`/study-sets/${studySet.id}`}>
                        <Play className="mr-2 h-4 w-4" />
                        Study
                      </Link>
                    </Button>
                    <Button asChild variant="outline" size="sm" className="flex-1">
                      <Link href={`/study-sets/${studySet.id}/practice`}>
                        Practice Exam
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* No results */}
        {filteredSets.length === 0 && searchQuery && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="h-8 w-8 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold mb-2">No study sets found</h2>
            <p className="text-muted-foreground">
              Try adjusting your search terms or create a new study set.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
