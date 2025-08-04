"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Trash2,
  Play,
  Calendar,
  Upload,
  Clock
} from "lucide-react";
import { getPracticeExams, deletePracticeExam } from "@/lib/exam-storage";
import { toast } from "react-hot-toast";
import { PracticeExam } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import NotLoggedInPrompt from "@/components/NotLoggedInPrompt";
import { EmptyState } from "@/components/EmptyState";
import { NoSearchResults } from "@/components/NoSearchResults";
import { formatDate } from "@/lib/utils";

import { motion } from "framer-motion";

export default function ExamsPage() {
  const [exams, setExams] = useState<PracticeExam[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredExams, setFilteredExams] = useState<PracticeExam[]>([]);
  const { user } = useAuth();

  const loadExams = useCallback(async () => {
    if (!user) {
      return <NotLoggedInPrompt />;
    }
    try {
      const fetchedExams = await getPracticeExams(user);
      setExams(fetchedExams);
    } catch (error) {
      console.error("Error loading exams:", error);
      setExams([]);
    }
  }, [user]);

  useEffect(() => {
    loadExams();
  }, [loadExams]);

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = exams.filter(
        (exam) =>
          exam.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredExams(filtered);
    } else {
      setFilteredExams(exams);
    }
  }, [searchQuery, exams]);

  if (!user) {
    return <NotLoggedInPrompt />;
  }

  // Custom confirmation using toast with action
  const handleDelete = (id: string) => {
    toast((t) => (
      <div className="flex flex-col gap-2">
        <span>Are you sure you want to delete this exam?</span>
        <div className="flex gap-2 mt-2">
          <Button
            size="sm"
            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1"
            onClick={async () => {
              toast.dismiss(t.id);
              toast.promise(
                deletePracticeExam(id, user),
                {
                  loading: "Deleting exam...",
                  success: () => {
                    loadExams();
                    return "Exam deleted successfully.";
                  },
                  error: (err) => {
                    console.error("Error deleting exam:", err);
                    return "Failed to delete exam.";
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

  if (exams.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/50 flex items-center justify-center">
        <EmptyState
          icon={FileText}
          title="No Exams Yet"
          description="Create your first exam to test your knowledge!"
          actionButton={{
            label: "Create Your First Exam",
            href: "/dashboard/exams/create",
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
            Manage Your Exams
          </h1>
        </motion.div>
      </section>

      {/* Search & Create Button */}
      <section className="container mx-auto px-4 pb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex-1 flex items-center max-w-md">
          <input
            type="text"
            placeholder="Search exams..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-sm"
          />
        </div>
        <Link href="/dashboard/exams/create">
          <Button size="lg" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 h-auto font-semibold flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Create New Exam
          </Button>
        </Link>
      </section>

      {/* Exams Grid */}
      <section className="container mx-auto px-4">
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {filteredExams.map((exam) => (
            <motion.div key={exam.id} variants={fadeInUp} className="relative">
              <Card className="h-full border-0 shadow-md hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white via-blue-50/60 to-indigo-50/80">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="line-clamp-2 text-xl font-bold text-gray-900">
                        {exam.title}
                      </CardTitle>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(exam.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 rounded-full"
                      aria-label="Delete Exam"
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
                        <FileText className="h-4 w-4 text-blue-500" />
                        <span className="font-medium text-gray-700">{exam.questions.length} questions</span>
                      </div>
                      <div className="flex items-center space-x-2 text-gray-400">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDate(exam.created)}</span>
                      </div>
                    </div>

                    {/* Duration */}
                    <div className="flex items-center space-x-2 bg-blue-50 rounded px-2 py-1 w-fit">
                      <Clock className="h-4 w-4 text-blue-400" />
                      <span className="text-xs text-blue-700">{exam.duration} minutes</span>
                    </div>

                    {/* Difficulty Distribution */}
                    <div className="flex space-x-1">
                      {["easy", "medium", "hard"].map((difficulty) => {
                        const count = exam.questions.filter(
                          (q) => q.difficulty === difficulty
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
                        <Link href={`/dashboard/exams/${exam.id}`}>
                          <Play className="mr-2 h-4 w-4" />
                          Take Exam
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
        {filteredExams.length === 0 && searchQuery && (
          <div className="pt-12">
            <NoSearchResults searchQuery={searchQuery} itemType="exams" />
          </div>
        )}
      </section>
    </div>
  );
}
