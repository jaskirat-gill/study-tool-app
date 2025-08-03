"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Clipboard,
  FileText,
  AlertCircle,
  CheckCircle,
  Sparkles,
} from "lucide-react";
import { saveStudyNotes } from "@/lib/storage";
import { StudyNotes } from "@/types";
import { generateId } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import NotLoggedInPrompt from "@/components/NotLoggedInPrompt";

export default function GenerateNotesPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [clipboardContent, setClipboardContent] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const { user } = useAuth();

  if (!user) {
    return <NotLoggedInPrompt />;
  }
  const handlePasteFromClipboard = async () => {
    try {
      if (!navigator.clipboard) {
        setError("Clipboard access is not available in this browser");
        return;
      }

      const text = await navigator.clipboard.readText();
      if (!text.trim()) {
        setError("Clipboard is empty");
        return;
      }

      setClipboardContent(text);
      setError("");

      // Auto-generate title if empty
      if (!title.trim()) {
        const words = text.trim().split(/\s+/).slice(0, 5);
        setTitle(
          words.join(" ") + (words.length === 5 ? "..." : "") + " - Notes"
        );
      }
    } catch (err) {
      console.error("Failed to read clipboard:", err);
      setError(
        "Failed to read from clipboard. Please make sure you have copied some text."
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      setError("Please provide a title for your notes");
      return;
    }

    setIsProcessing(true);
    setProgress(5);
    setError("");
    setSuccess("");

    try {
      // First, try to read from clipboard
      let contentToProcess = clipboardContent.trim();

      if (!contentToProcess) {
        setProgress(10);
        // Try to read from clipboard
        if (!navigator.clipboard) {
          throw new Error("Clipboard access is not available in this browser");
        }

        const clipboardText = await navigator.clipboard.readText();
        if (!clipboardText.trim()) {
          throw new Error(
            "Clipboard is empty. Please copy some content first."
          );
        }

        contentToProcess = clipboardText.trim();
        setClipboardContent(contentToProcess);

        // Auto-generate title if empty
        if (!title.trim()) {
          const words = contentToProcess.split(/\s+/).slice(0, 5);
          const generatedTitle =
            words.join(" ") + (words.length === 5 ? "..." : "") + " - Notes";
          setTitle(generatedTitle);
        }
      }

      if (contentToProcess.length < 50) {
        throw new Error(
          "Content is too short. Please provide more substantial content to generate meaningful notes."
        );
      }

      // Simulate progress
      setProgress(20);
      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 10, 80));
      }, 500);

      // Call the API to generate notes
      const response = await fetch("/api/generate-notes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: contentToProcess,
        }),
      });

      clearInterval(progressInterval);
      setProgress(90);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate notes");
      }

      const { notes } = await response.json();

      if (!notes) {
        throw new Error("No notes were generated");
      }

      // Create and save the study notes
      const studyNotes: StudyNotes = {
        id: generateId(),
        title: title.trim(),
        content: notes,
        created: new Date(),
        lastModified: new Date(),
        sourceContent: contentToProcess,
      };

      await saveStudyNotes(studyNotes, user);

      setProgress(100);
      setSuccess("Notes generated successfully! Redirecting...");

      // Redirect after a short delay
      setTimeout(() => {
        router.push(`/notes/${studyNotes.id}`);
      }, 2000);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred"
      );
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
            <Sparkles className="h-8 w-8 text-primary" />
            Generate Study Notes
          </h1>
          <p className="text-muted-foreground">
            Generate comprehensive review notes from content in your clipboard
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Create Study Notes from Clipboard</CardTitle>
            <CardDescription>
              Copy content to your clipboard, provide a title, and generate
              AI-powered study notes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Title Input */}
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter a title for your study notes"
                  required
                />
              </div>

              {/* Clipboard Content (optional preview) */}
              {clipboardContent && (
                <div className="space-y-2">
                  <Label>Content Preview</Label>
                  <div className="space-y-2">
                    <Textarea
                      value={clipboardContent}
                      onChange={(e) => setClipboardContent(e.target.value)}
                      placeholder="Content from clipboard"
                      rows={6}
                      className="resize-none"
                    />
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {clipboardContent.length} characters
                      </span>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={handlePasteFromClipboard}
                        >
                          <Clipboard className="h-4 w-4 mr-1" />
                          Refresh
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setClipboardContent("")}
                        >
                          Clear
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Progress */}
              {isProcessing && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      Generating notes...
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {progress}%
                    </span>
                  </div>
                  <Progress value={progress} />
                </div>
              )}

              {/* Error Message */}
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Success Message */}
              {success && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>{success}</AlertDescription>
                </Alert>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full"
                disabled={!title.trim() || isProcessing}
              >
                {isProcessing
                  ? "Generating Notes..."
                  : "Generate Study Notes from Clipboard"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">How to Use</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">
                  1
                </div>
                <div>
                  <p className="font-medium">Copy Content</p>
                  <p className="text-muted-foreground">
                    Copy text from any source (documents, articles, textbooks)
                    to your clipboard
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">
                  2
                </div>
                <div>
                  <p className="font-medium">Add Title & Generate</p>
                  <p className="text-muted-foreground">
                    Provide a descriptive title and click &quot;Generate Study
                    Notes from Clipboard&quot;
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">
                  3
                </div>
                <div>
                  <p className="font-medium">AI Processing</p>
                  <p className="text-muted-foreground">
                    AI will automatically read your clipboard and create
                    comprehensive study notes
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tips */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <FileText className="mr-2 h-5 w-5" />
              Tips for Better Notes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                • Copy substantial content (at least 200 characters) to your
                clipboard before generating
              </li>
              <li>
                • The app will automatically read from your clipboard when you
                click generate
              </li>
              <li>
                • Include headings, definitions, and key concepts for better
                organization
              </li>
              <li>
                • Copy content from reliable educational sources for accurate
                information
              </li>
              <li>
                • Review and edit the generated notes to add your own insights
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
