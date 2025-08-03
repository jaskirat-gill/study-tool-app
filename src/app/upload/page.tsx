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
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Upload, FileText, AlertCircle, CheckCircle } from "lucide-react";
import {
  extractTextFromFile,
  validateFileSize,
  validateFileType,
} from "@/lib/document-processor";
import { generateFlashcards } from "@/lib/gemini-client";
import { saveStudySet } from "@/lib/storage";
import { StudySet } from "@/types";
import { generateId } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import NotLoggedInPrompt from "@/components/NotLoggedInPrompt";

export default function UploadPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [flashcardCount, setFlashcardCount] = useState([15]); // Default to 15 flashcards
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const { user } = useAuth();

  if (!user) {
    return <NotLoggedInPrompt />;
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setError("");
    setSuccess("");

    // Validate file type
    if (!validateFileType(selectedFile)) {
      setError("Please select a valid file type (PDF, DOCX, or TXT)");
      return;
    }

    // Validate file size (10MB limit)
    if (!validateFileSize(selectedFile, 10)) {
      setError("File size must be less than 10MB");
      return;
    }

    setFile(selectedFile);

    // Auto-generate title from filename if empty
    if (!title) {
      const fileName = selectedFile.name.replace(/\.[^/.]+$/, "");
      setTitle(fileName);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file || !title.trim()) {
      setError("Please select a file and provide a title");
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    setError("");

    try {
      // Step 1: Extract text from file
      setProgress(25);
      const extractResult = await extractTextFromFile(file);

      if (!extractResult.success) {
        throw new Error(extractResult.error);
      }

      // Step 2: Generate flashcards
      setProgress(50);
      const flashcardsResult = await generateFlashcards(
        extractResult.content!,
        flashcardCount[0]
      );

      if (flashcardsResult.error) {
        throw new Error(flashcardsResult.error);
      }

      if (
        !flashcardsResult.flashcards ||
        flashcardsResult.flashcards.length === 0
      ) {
        throw new Error("No flashcards could be generated from this content");
      }

      // Step 3: Create and save study set
      setProgress(75);
      const studySet: StudySet = {
        id: generateId(),
        title: title.trim(),
        description: description.trim() || undefined,
        flashcards: flashcardsResult.flashcards,
        created: new Date(),
        lastModified: new Date(),
        sourceDocument: {
          name: file.name,
          type: file.type,
          size: file.size,
        },
      };
      saveStudySet(studySet, user);
      setProgress(100);

      setSuccess(
        `Successfully created study set with ${flashcardsResult.flashcards.length} flashcards!`
      );

      // Redirect to the new study set after a short delay
      setTimeout(() => {
        router.push(`/study-sets/${studySet.id}`);
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
          <h1 className="text-3xl font-bold">Upload Document</h1>
          <p className="text-muted-foreground">
            Upload a document to generate AI-powered flashcards
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Document Upload</CardTitle>
            <CardDescription>
              Select a PDF, DOCX, or TXT file to create your study set
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* File Upload */}
              <div className="space-y-2">
                <Label htmlFor="file">Document File</Label>
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                  <input
                    id="file"
                    type="file"
                    accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <label
                    htmlFor="file"
                    className="cursor-pointer flex flex-col items-center space-y-2"
                  >
                    {file ? (
                      <>
                        <FileText className="h-8 w-8 text-green-600" />
                        <div className="space-y-1">
                          <p className="font-medium">{file.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                        <Badge variant="secondary">File Selected</Badge>
                      </>
                    ) : (
                      <>
                        <Upload className="h-8 w-8 text-muted-foreground" />
                        <div className="space-y-1">
                          <p className="font-medium">Click to upload a file</p>
                          <p className="text-sm text-muted-foreground">
                            PDF, DOCX, or TXT (max 10MB)
                          </p>
                        </div>
                      </>
                    )}
                  </label>
                </div>
              </div>

              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Study Set Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter a title for your study set"
                  required
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add a description for your study set"
                  rows={3}
                />
              </div>

              {/* Flashcard Count */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="flashcard-count">Number of Flashcards</Label>
                  <Badge variant="outline" className="text-sm">
                    {flashcardCount[0]} cards
                  </Badge>
                </div>
                <div className="px-3">
                  <Slider
                    id="flashcard-count"
                    min={5}
                    max={50}
                    step={5}
                    value={flashcardCount}
                    onValueChange={setFlashcardCount}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>5 cards</span>
                    <span>25 cards</span>
                    <span>50 cards</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  More flashcards will take longer to generate but provide more
                  comprehensive coverage.
                </p>
              </div>

              {/* Progress */}
              {isProcessing && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Processing...</span>
                    <span className="text-sm text-muted-foreground">
                      {progress}%
                    </span>
                  </div>
                  <Progress value={progress} />
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-3 rounded-lg">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              {/* Success Message */}
              {success && (
                <div className="flex items-center space-x-2 text-green-600 bg-green-50 p-3 rounded-lg">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-sm">{success}</span>
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full"
                disabled={!file || !title.trim() || isProcessing}
              >
                {isProcessing ? "Processing..." : "Generate Flashcards"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Supported Formats */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Supported Formats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="space-y-2">
                <div className="w-12 h-12 bg-red-100 text-red-600 rounded-lg flex items-center justify-center mx-auto">
                  <FileText className="h-6 w-6" />
                </div>
                <p className="font-medium">PDF</p>
                <p className="text-xs text-muted-foreground">
                  Portable Document Format
                </p>
              </div>
              <div className="space-y-2">
                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center mx-auto">
                  <FileText className="h-6 w-6" />
                </div>
                <p className="font-medium">DOCX</p>
                <p className="text-xs text-muted-foreground">Word Documents</p>
              </div>
              <div className="space-y-2">
                <div className="w-12 h-12 bg-green-100 text-green-600 rounded-lg flex items-center justify-center mx-auto">
                  <FileText className="h-6 w-6" />
                </div>
                <p className="font-medium">TXT</p>
                <p className="text-xs text-muted-foreground">
                  Plain Text Files
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
