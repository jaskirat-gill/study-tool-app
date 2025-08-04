'use client'

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { DocumentUpload } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { 
  Upload, 
  FileText, 
  Plus
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "react-hot-toast";
import { getDocumentUploads } from "@/lib/storage/document-storage";
import { saveStudySet } from "@/lib/storage/study-set-storage";

export default function GenerateFlashCards() {
  const router = useRouter();
  const { user } = useAuth();
  const [uploads, setUploads] = useState<DocumentUpload[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string>("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [flashcardCount, setFlashcardCount] = useState([15]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!user) return;
    getDocumentUploads(user).then(setUploads);
  }, [user]);

  const selectedDoc = uploads.find((doc) => doc.id === selectedDocId);

  const processContent = async () => {
    if (!selectedDoc) {
      toast.error('Please select a document');
      return;
    }
    if (!title.trim()) {
      toast.error('Please provide a title');
      return;
    }
    setIsProcessing(true);
    setProgress(0);
    try {
      setProgress(30);
      // Generate flashcards
      const flashcardsResponse = await fetch('/api/generate-flashcards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: selectedDoc.content,
          count: flashcardCount[0]
        }),
      });
      if (!flashcardsResponse.ok) {
        throw new Error('Failed to generate flashcards');
      }
      const response = await flashcardsResponse.json();
      const flashcards = response.flashcards || response;
      if (!Array.isArray(flashcards)) {
        console.error('Unexpected flashcards format:', flashcards);
        throw new Error('Received invalid flashcards data format from server');
      }
      
      // Ensure each flashcard has the required properties
      const formattedFlashcards = flashcards.map(card => ({
        id: card.id || crypto.randomUUID(),
        front: card.front,
        back: card.back,
        difficulty: card.difficulty || 'medium',
        created: new Date(card.created || new Date()),
        lastReviewed: undefined,
        reviewCount: card.reviewCount || 0,
        correctCount: card.correctCount || 0
      }));
      setProgress(70);

      // Save study set to DB
      if (!user) {
        toast.error('You must be logged in to save a study set.');
        return;
      }
      const studySet = {
        id: crypto.randomUUID(),
        title,
        description,
        created: new Date(),
        lastModified: new Date(),
        sourceDocument: {
          name: selectedDoc.name,
          type: selectedDoc.type,
          size: selectedDoc.size,
        },
        flashcards: formattedFlashcards,
      };
      await saveStudySet(studySet, user);
      setProgress(100);
      toast.success('Study set created successfully!');
      setTimeout(() => {
        router.push('/dashboard/study-sets');
      }, 1500);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Processing or saving failed');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Document Selection Section */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="mr-2 h-5 w-5" />
                Select Document
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {uploads.length === 0 ? (
                <div className="text-center space-y-4">
                  <p className="text-gray-700">You have not uploaded any documents yet.</p>
                  <Link href="/dashboard/upload">
                    <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                      <Upload className="mr-2 h-4 w-4" />
                      Upload a Document
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  <Label htmlFor="doc-select">Choose a document to generate flashcards from:</Label>
                  <select
                    id="doc-select"
                    value={selectedDocId}
                    onChange={e => {
                      setSelectedDocId(e.target.value);
                      const doc = uploads.find(d => d.id === e.target.value);
                      if (doc && !title) setTitle(doc.name);
                    }}
                    className="w-full border rounded-lg px-3 py-2"
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
                  <div className="pt-4 text-center">
                    <Link href="/dashboard/upload">
                      <Button variant="outline" className="w-full flex items-center justify-center">
                        <Upload className="mr-2 h-4 w-4" />
                        Need another document? Upload here
                      </Button>
                    </Link>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Configuration Section */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Study Set Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Title Input */}
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter a title for your study set"
                  className="w-full"
                />
              </div>

              {/* Description Input */}
              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add a description for your study set"
                  className="w-full"
                  rows={3}
                />
              </div>

              {/* Flashcard Count */}
              <div className="space-y-4">
                <Label>Number of Flashcards: {flashcardCount[0]}</Label>
                <Slider
                  value={flashcardCount}
                  onValueChange={setFlashcardCount}
                  max={50}
                  min={5}
                  step={5}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-gray-500">
                  <span>5</span>
                  <span>50</span>
                </div>
              </div>

              {/* Progress Bar */}
              {isProcessing && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Processing...</span>
                    <span>{progress}%</span>
                  </div>
                  <Progress value={progress} className="w-full" />
                </div>
              )}

              {/* Action Button */}
              <Button
                onClick={processContent}
                disabled={isProcessing || !selectedDoc}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                size="lg"
              >
                {isProcessing ? (
                  'Processing...'
                ) : (
                  <>
                    <Plus className="mr-2 h-5 w-5" />
                    Create Study Set
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
