"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  Upload,
  Calendar,
  FileText,
  Trash2,
  Play,
} from "lucide-react";
import { getStudySets, deleteStudySet } from "@/lib/storage";
import { StudySet } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import NotLoggedInPrompt from "@/components/NotLoggedInPrompt";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { NoSearchResults } from "@/components/NoSearchResults";
import { formatDate } from "@/lib/utils";
import { useCallback } from "react";

export default function StudySetsPage() {
  const [studySets, setStudySets] = useState<StudySet[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredSets, setFilteredSets] = useState<StudySet[]>([]);
  const { user } = useAuth();

  const loadStudySets = useCallback(async () => {
    if (!user) {
      return <NotLoggedInPrompt />;
    }
    try {
      const sets = await getStudySets(user);
      setStudySets(sets);
    } catch (error) {
      console.error("Error loading study sets:", error);
      setStudySets([]);
    }
  }, [user]);

  useEffect(() => {
    loadStudySets();
  }, [loadStudySets]);

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = studySets.filter(
        (set) =>
          set.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          set.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredSets(filtered);
    } else {
      setFilteredSets(studySets);
    }
  }, [searchQuery, studySets]);

  if (!user) {
    return <NotLoggedInPrompt />;
  }

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this study set?")) {
      try {
        await deleteStudySet(id, user);
        loadStudySets();
      } catch (error) {
        console.error("Error deleting study set:", error);
      }
    }
  };

  if (studySets.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <EmptyState
          icon={BookOpen}
          title="No Study Sets Yet"
          description="Upload your first document to create AI-powered flashcards and start studying!"
          actionButton={{
            label: "Create Your First Study Set",
            href: "dashboard/upload",
            icon: Upload,
          }}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-6">
        <PageHeader
          title="Study Sets"
          subtitle="Manage your AI-generated flashcard collections"
          actionButton={{
            label: "Create New Set",
            href: "dashboard/upload",
            icon: Upload,
          }}
          showSearch
          searchPlaceholder="Search study sets..."
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
        />

        {/* Study Sets Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSets.map((studySet) => (
            <Card
              key={studySet.id}
              className="hover:shadow-lg transition-shadow"
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1">
                    <CardTitle className="line-clamp-2">
                      {studySet.title}
                    </CardTitle>
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
                    {["easy", "medium", "hard"].map((difficulty) => {
                      const count = studySet.flashcards.filter(
                        (card) => card.difficulty === difficulty
                      ).length;
                      if (count === 0) return null;

                      return (
                        <Badge
                          key={difficulty}
                          variant={
                            difficulty === "easy"
                              ? "secondary"
                              : difficulty === "medium"
                              ? "default"
                              : "destructive"
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
                      <Link href={`dashboard/study-sets/${studySet.id}`}>
                        <Play className="mr-2 h-4 w-4" />
                        Study
                      </Link>
                    </Button>
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="flex-1"
                    >
                      <Link href={`dashboard/study-sets/${studySet.id}/practice`}>
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
          <NoSearchResults searchQuery={searchQuery} itemType="study sets" />
        )}
      </div>
    </div>
  );
}
