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
import { toast } from "react-hot-toast";
import { StudySet } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import NotLoggedInPrompt from "@/components/NotLoggedInPrompt";
// ...existing code...
import { EmptyState } from "@/components/EmptyState";
import { NoSearchResults } from "@/components/NoSearchResults";
import { formatDate } from "@/lib/utils";
import { useCallback } from "react";

import { motion } from "framer-motion";

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

  // Custom confirmation using toast with action
  const handleDelete = (id: string) => {
    toast((t) => (
      <div className="flex flex-col gap-2">
        <span>Are you sure you want to delete this study set?</span>
        <div className="flex gap-2 mt-2">
          <Button
            size="sm"
            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1"
            onClick={async () => {
              toast.dismiss(t.id);
              toast.promise(
                deleteStudySet(id, user),
                {
                  loading: "Deleting study set...",
                  success: () => {
                    loadStudySets();
                    return "Study set deleted successfully.";
                  },
                  error: (err) => {
                    console.error("Error deleting study set:", err);
                    return "Failed to delete study set.";
                  },
                }
              );
            }}
          >
            Yes, Delete
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="px-3 py-1"
            onClick={() => toast.dismiss(t.id)}
          >
            Cancel
          </Button>
        </div>
      </div>
    ), { duration: 8000 });
  };

  if (studySets.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/50 flex items-center justify-center">
        <EmptyState
          icon={BookOpen}
          title="No Study Sets Yet"
          description="Upload your first document to create AI-powered flashcards and start studying!"
          actionButton={{
            label: "Create Your First Study Set",
            href: "/dashboard/study-sets/create",
            icon: Upload,
          }}
        />
      </div>
    );
  }

  // Animation variants
  const fadeInUp = {
    initial: { opacity: 0, y: 40 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5 }
  };
  const staggerContainer = {
    animate: {
      transition: {
        staggerChildren: 0.08
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/50 pb-16">
      {/* Header Section */}
      <section className="container mx-auto px-4 pt-12 pb-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="text-center max-w-3xl mx-auto space-y-4"
        >
          <h1 className="text-4xl md:text-5xl pb-2 font-bold tracking-tight bg-gradient-to-r from-gray-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent">
            Manage Your Flashcards
          </h1>
        </motion.div>
      </section>

      {/* Search & Create Button */}
      <section className="container mx-auto px-4 pb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex-1 flex items-center max-w-md">
          <input
            type="text"
            placeholder="Search study sets..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-sm"
          />
        </div>
        <Link href="/dashboard/study-sets/create">
          <Button size="lg" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 h-auto font-semibold flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Create New Set
          </Button>
        </Link>
      </section>

      {/* Study Sets Grid */}
      <section className="container mx-auto px-4">
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {filteredSets.map((studySet) => (
            <motion.div key={studySet.id} variants={fadeInUp} className="relative">
              <Card className="h-full border-0 shadow-md hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white via-blue-50/60 to-indigo-50/80">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="line-clamp-2 text-xl font-bold text-gray-900">
                        {studySet.title}
                      </CardTitle>
                      {studySet.description && (
                        <CardDescription className="line-clamp-2 text-gray-600 mt-1">
                          {studySet.description}
                        </CardDescription>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(studySet.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 rounded-full"
                      aria-label="Delete Study Set"
                    >
                      <Trash2 className="h-5 w-5" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Stats */}
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-2">
                        <BookOpen className="h-4 w-4 text-blue-500" />
                        <span className="font-medium text-gray-700">{studySet.flashcards.length} flashcards</span>
                      </div>
                      <div className="flex items-center space-x-2 text-gray-400">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDate(studySet.created)}</span>
                      </div>
                    </div>

                    {/* Source Document */}
                    {studySet.sourceDocument && (
                      <div className="flex items-center space-x-2 bg-blue-50 rounded px-2 py-1 w-fit">
                        <FileText className="h-4 w-4 text-blue-400" />
                        <span className="text-xs text-blue-700 truncate max-w-[120px]">{studySet.sourceDocument.name}</span>
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
                            className="text-xs capitalize px-2 py-0.5"
                          >
                            {count} {difficulty}
                          </Badge>
                        );
                      })}
                    </div>

                    {/* Actions */}
                    <div className="flex space-x-2 pt-2">
                      <Button asChild size="sm" className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700">
                        <Link href={`/dashboard/study-sets/${studySet.id}`}>
                          <Play className="mr-2 h-4 w-4" />
                          Study
                        </Link>
                      </Button>
                      <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className="flex-1 border-blue-200 text-blue-700 hover:bg-blue-50"
                      >
                        <Link href={`/dashboard/study-sets/${studySet.id}/practice`}>
                          Practice Exam
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
              {/* Decorative gradient ring */}
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-blue-200 to-indigo-200 rounded-full blur-sm opacity-40 pointer-events-none" />
            </motion.div>
          ))}
        </motion.div>

        {/* No results */}
        {filteredSets.length === 0 && searchQuery && (
          <div className="pt-12">
            <NoSearchResults searchQuery={searchQuery} itemType="study sets" />
          </div>
        )}
      </section>
    </div>
  );
}
