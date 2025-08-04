"use client";

import { useState, useEffect } from "react";
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
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FileText, AlertCircle, CheckCircle, Sparkles } from "lucide-react";
import { saveStudyNotes } from "@/lib/storage/study-notes-storage";
import { getDocumentUploads } from "@/lib/storage/document-storage";
import { StudyNotes, DocumentUpload } from "@/types";
import { generateId } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import NotLoggedInPrompt from "@/components/NotLoggedInPrompt";

export default function GenerateNotesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [uploads, setUploads] = useState<DocumentUpload[]>([]);
  const [selectedDocId, setSelectedDocId] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  useEffect(() => {
    if (!user) return;
    getDocumentUploads(user).then(setUploads);
  }, [user]);

  const selectedDoc = uploads.find((doc) => doc.id === selectedDocId);

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/50 flex items-center justify-center">
        <NotLoggedInPrompt />
      </div>
    );
  }


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedDoc) {
      setError("Please select a document to generate notes from.");
      return;
    }
    if (!title.trim()) {
      setError("Please provide a title for your notes");
      return;
    }

    setIsProcessing(true);
    setProgress(5);
    setError("");
    setSuccess("");

    try {
      const contentToProcess = selectedDoc.content.trim();
      if (contentToProcess.length < 50) {
        throw new Error("Document content is too short. Please select a document with more substantial content.");
      }

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

      setTimeout(() => {
        router.push(`/dashboard/notes/${studyNotes.id}`);
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
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/50 pb-16">
      {/* Header Section */}
      <section className="container mx-auto px-4 pt-12 pb-6">
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <h1 className="text-4xl md:text-5xl pb-2 font-bold tracking-tight bg-gradient-to-r from-gray-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent flex items-center justify-center gap-2">
            <Sparkles className="h-8 w-8 text-primary" />
            Generate Study Notes
          </h1>
          <p className="text-muted-foreground">
            Generate comprehensive review notes from your uploaded documents
          </p>
        </div>
      </section>

      {/* Main Card Section */}
      <section className="container mx-auto px-4 pb-6 flex flex-col md:flex-row md:items-start md:justify-center gap-8">

        <div className="w-full max-w-2xl">
          <Card className="shadow-md hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white via-blue-50/60 to-indigo-50/80 border-0">
            <CardHeader>
              <CardTitle>Create Study Notes from Document</CardTitle>
              <CardDescription>
                Select an uploaded document, provide a title, and generate AI-powered study notes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Document Selection */}
                <div className="space-y-2">
                  <Label htmlFor="doc-select">Select Document *</Label>
                  <select
                    id="doc-select"
                    value={selectedDocId}
                    onChange={e => {
                      setSelectedDocId(e.target.value);
                      const doc = uploads.find(d => d.id === e.target.value);
                      if (doc && !title) setTitle(doc.name);
                    }}
                    className="w-full border rounded-lg px-3 py-2"
                    required
                  >
                    <option value="">-- Select a document --</option>
                    {uploads.map(doc => (
                      <option key={doc.id} value={doc.id}>
                        {doc.name} ({(doc.size / 1024).toFixed(1)} KB)
                      </option>
                    ))}
                  </select>
                  {selectedDoc && (
                    <div className="bg-gray-50 rounded-lg p-3 mt-2">
                      <div className="font-medium text-gray-900">{selectedDoc.name}</div>
                      <div className="text-xs text-gray-500 mb-1">{selectedDoc.description}</div>
                      <div className="text-xs text-gray-400">Uploaded: {selectedDoc.created.toLocaleDateString()}</div>
                    </div>
                  )}
                </div>

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
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 font-semibold py-3 h-auto"
                  disabled={!title.trim() || !selectedDoc || isProcessing}
                >
                  {isProcessing
                    ? "Generating Notes..."
                    : "Generate Study Notes from Document"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Instructions & Tips */}
        <div className="w-full max-w-md space-y-6">
          <Card className="shadow bg-white/80 border-0">
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
                    <p className="font-medium">Upload Document</p>
                    <p className="text-muted-foreground">
                      Upload a document (PDF, text, etc.) in the <b>Upload</b> section
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">
                    2
                  </div>
                  <div>
                    <p className="font-medium">Select & Generate</p>
                    <p className="text-muted-foreground">
                      Select your uploaded document, provide a title, and click &apos;Generate Study Notes from Document&apos;
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
                      AI will automatically read your document and create comprehensive study notes
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow bg-white/80 border-0">
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <FileText className="mr-2 h-5 w-5" />
                Tips for Better Notes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  • Select a document with substantial content (at least 200 characters) for best results
                </li>
                <li>
                  • Include headings, definitions, and key concepts in your documents for better organization
                </li>
                <li>
                  • Use reliable educational sources for accurate information
                </li>
                <li>
                  • Review and edit the generated notes to add your own insights
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
