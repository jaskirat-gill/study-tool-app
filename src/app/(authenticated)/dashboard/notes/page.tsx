"use client";

import { useEffect, useState, useCallback } from "react";
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
  Calendar,
  FileText,
  Trash2,
  Plus,
  Sparkles,
} from "lucide-react";
import { getStudyNotes, deleteStudyNote } from "@/lib/storage/study-notes-storage";
import { StudyNotes } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import NotLoggedInPrompt from "@/components/NotLoggedInPrompt";
import { EmptyState } from "@/components/EmptyState";
import { NoSearchResults } from "@/components/NoSearchResults";
import { formatDate } from "@/lib/utils";


export default function NotesListPage() {
  const [notes, setNotes] = useState<StudyNotes[]>([]);
  const [filteredNotes, setFilteredNotes] = useState<StudyNotes[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const { user } = useAuth();

  const loadNotes = useCallback(async () => {
    if (!user) return;
    const savedNotes = await getStudyNotes(user);
    // Sort by creation date (newest first)
    savedNotes.sort((a, b) => b.created.getTime() - a.created.getTime());
    setNotes(savedNotes);
  }, [user]);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  useEffect(() => {
    // Filter notes based on search query
    if (searchQuery.trim() === "") {
      setFilteredNotes(notes);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = notes.filter(
        (note) =>
          note.title.toLowerCase().includes(query) ||
          note.content.toLowerCase().includes(query)
      );
      setFilteredNotes(filtered);
    }
  }, [notes, searchQuery]);

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/50 flex items-center justify-center">
        <NotLoggedInPrompt />
      </div>
    );
  }

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete these notes? This action cannot be undone."
    );
    if (!confirmed) return;

    try {
      await deleteStudyNote(id, user);
      loadNotes(); // Reload the list
    } catch (error) {
      console.error("Error deleting notes:", error);
    }
  };

  const truncateContent = (content: string, maxLength: number = 150) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength).trim() + "...";
  };


  if (notes.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/50 flex items-center justify-center pb-16">
        <div className="container mx-auto px-4 py-8">
          <div className="space-y-6">
            <div className="text-center max-w-3xl mx-auto space-y-4">
              <h1 className="text-4xl md:text-5xl pb-2 font-bold tracking-tight bg-gradient-to-r from-gray-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent flex items-center justify-center gap-2">
                <Sparkles className="h-8 w-8 text-primary" />
                Study Notes
              </h1>
              <p className="text-muted-foreground">
                AI-generated comprehensive review notes
              </p>
            </div>
            <EmptyState
              icon={FileText}
              title="No Study Notes Yet"
              description="Create your first set of AI-generated study notes from clipboard content."
              actionButton={{
                label: "Generate Your First Notes",
                href: "/dashboard/notes/generate",
                icon: Sparkles,
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/50 pb-16">
      {/* Header Section */}
      <section className="container mx-auto px-4 pt-12 pb-6">
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <h1 className="text-4xl md:text-5xl pb-2 font-bold tracking-tight bg-gradient-to-r from-gray-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent flex items-center justify-center gap-2">
            <Sparkles className="h-8 w-8 text-primary" />
            Study Notes
          </h1>
          <p className="text-muted-foreground">
            Manage your AI-generated study notes
          </p>
        </div>
      </section>

      {/* Search & Stats Section */}
      <section className="container mx-auto px-4 pb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex-1 flex items-center max-w-md">
          <input
            type="text"
            placeholder="Search notes..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-sm"
          />
        </div>
        <Link href="/dashboard/notes/generate">
          <Button size="lg" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 h-auto font-semibold flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Generate New Notes
          </Button>
        </Link>
      </section>

      {/* Stats */}
      <section className="container mx-auto px-4 pb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-0 shadow bg-white/80">
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{notes.length}</div>
              <p className="text-xs text-muted-foreground">Total Notes</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow bg-white/80">
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{filteredNotes.length}</div>
              <p className="text-xs text-muted-foreground">
                {searchQuery ? "Search Results" : "Available Notes"}
              </p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow bg-white/80">
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">
                {
                  notes.filter((note) => {
                    const daysDiff = Math.floor(
                      (Date.now() - note.created.getTime()) /
                        (1000 * 60 * 60 * 24)
                    );
                    return daysDiff <= 7;
                  }).length
                }
              </div>
              <p className="text-xs text-muted-foreground">Created This Week</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Notes Grid */}
      <section className="container mx-auto px-4">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredNotes.map((note) => (
            <Card
              key={note.id}
              className="group hover:shadow-md transition-shadow border-0 bg-gradient-to-br from-white via-blue-50/60 to-indigo-50/80"
            >
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                <div className="space-y-1 flex-1 min-w-0">
                  <CardTitle className="text-lg line-clamp-2">
                    <Link
                      href={`dashboard/notes/${note.id}`}
                      className="hover:text-primary transition-colors"
                    >
                      {note.title}
                    </Link>
                  </CardTitle>
                </div>
                <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(note.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Content Preview */}
                  <CardDescription className="text-sm line-clamp-3">
                    {truncateContent(note.content.replace(/[#*-]/g, "").trim())}
                  </CardDescription>

                  {/* Metadata */}
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-1 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>{formatDate(note.created)}</span>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      <FileText className="h-3 w-3 mr-1" />
                      Notes
                    </Badge>
                  </div>

                  {/* Action Button */}
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="w-full"
                  >
                    <Link href={`dashboard/notes/${note.id}`}>View Notes</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* No Results */}
        {searchQuery && filteredNotes.length === 0 && (
          <div className="pt-12">
            <NoSearchResults searchQuery={searchQuery} itemType="notes" />
          </div>
        )}
      </section>
    </div>
  );
}
