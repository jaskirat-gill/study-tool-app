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
import { Input } from "@/components/ui/input";
import {
  Sparkles,
  Search,
  Calendar,
  FileText,
  Trash2,
  Plus,
} from "lucide-react";
import { getStudyNotes, deleteStudyNote } from "@/lib/storage/study-notes-storage";
import { StudyNotes } from "@/types";
import { formatDate } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import NotLoggedInPrompt from "@/components/NotLoggedInPrompt";

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
    return <NotLoggedInPrompt />;
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
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div>
              <h1 className="text-3xl font-bold">Study Notes</h1>
              <p className="text-muted-foreground">
                AI-generated comprehensive review notes
              </p>
            </div>
            <Button asChild>
              <Link href="/notes">
                <Plus className="mr-2 h-4 w-4" />
                Generate Notes
              </Link>
            </Button>
          </div>

          {/* Empty State */}
          <div className="text-center py-12">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No Study Notes Yet</h3>
              <p className="text-muted-foreground mb-6">
                Create your first set of AI-generated study notes from clipboard
                content.
              </p>
              <Button asChild>
                <Link href="/notes">
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate Your First Notes
                </Link>
              </Button>
            </div>
          </div>
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
            <h1 className="text-3xl font-bold">Study Notes</h1>
            <p className="text-muted-foreground">
              Manage your AI-generated study notes
            </p>
          </div>
          <Button asChild>
            <Link href="/notes">
              <Plus className="mr-2 h-4 w-4" />
              Generate New Notes
            </Link>
          </Button>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{notes.length}</div>
              <p className="text-xs text-muted-foreground">Total Notes</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{filteredNotes.length}</div>
              <p className="text-xs text-muted-foreground">
                {searchQuery ? "Search Results" : "Available Notes"}
              </p>
            </CardContent>
          </Card>
          <Card>
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

        {/* Notes Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredNotes.map((note) => (
            <Card
              key={note.id}
              className="group hover:shadow-md transition-shadow"
            >
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                <div className="space-y-1 flex-1 min-w-0">
                  <CardTitle className="text-lg line-clamp-2">
                    <Link
                      href={`/notes/${note.id}`}
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
                    <Link href={`/notes/${note.id}`}>View Notes</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* No Results */}
        {searchQuery && filteredNotes.length === 0 && (
          <div className="text-center py-8">
            <div className="max-w-md mx-auto">
              <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Notes Found</h3>
              <p className="text-muted-foreground">
                No notes match your search query &quot;{searchQuery}&quot;. Try
                a different search term.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
