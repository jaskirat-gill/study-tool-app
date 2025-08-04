'use client'

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getDocumentUploads } from "@/lib/storage/document-storage";
import { savePracticeExam } from "@/lib/storage/exam-storage";
import { generateExamQuestions } from "@/lib/controller";
import { useAuth } from "@/contexts/AuthContext";
import { DocumentUpload } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { 
  Upload, 
  File, 
  Plus
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "react-hot-toast";
import { generateId } from "@/lib/utils";

export default function GenerateExam() {
  const router = useRouter();
  const { user } = useAuth();
  const [documents, setDocuments] = useState<DocumentUpload[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string>("");
  const [title, setTitle] = useState("");
  const [multipleChoiceCount, setMultipleChoiceCount] = useState([5]); // Default to 5 MC questions
  const [fillInBlankCount, setFillInBlankCount] = useState([0]); // Default to 0 FIB questions
  const [shortAnswerCount, setShortAnswerCount] = useState([0]); // Default to 0 SA questions
  const [fillInBlankWordBank, setFillInBlankWordBank] = useState<string>(''); // Word bank for fill-in-blank questions
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    getDocumentUploads(user).then(setDocuments);
  }, [user]);

  const selectedDoc = documents.find((doc) => doc.id === selectedDocId);

  const generateExam = async () => {
    if (!selectedDoc) {
      toast.error('Please select a document');
      return;
    }
    if (!title.trim()) {
      toast.error('Please provide a title');
      return;
    }

    const totalQuestions = multipleChoiceCount[0] + fillInBlankCount[0] + shortAnswerCount[0];
    if (totalQuestions === 0) {
      toast.error('Please select at least one question type');
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    setError(null);
    
    try {
      setProgress(20);
      
      // Extract content from document
      const content = selectedDoc.content;
      
      // Process word bank if provided
      const wordBankArray = fillInBlankWordBank.trim() 
        ? fillInBlankWordBank.split(',').map(word => word.trim()).filter(word => word.length > 0)
        : undefined;
      
      setProgress(40);
      
      // Generate exam questions using the imported function
      const result = await generateExamQuestions(
        content,
        multipleChoiceCount[0],
        fillInBlankCount[0],
        shortAnswerCount[0],
        wordBankArray
      );
      
      if (result.error) {
        setError(result.error);
        return;
      }
      
      if (!result.examQuestions || !Array.isArray(result.examQuestions)) {
        throw new Error('Received invalid questions data format from server');
      }
      
      setProgress(70);

      // Save exam to DB
      if (!user) {
        toast.error('You must be logged in to save an exam.');
        return;
      }
      
      const exam = {
        id: generateId(),
        title,
        questions: result.examQuestions,
        duration: 0, // Set to 0 as we're not using duration anymore
        created: new Date(),
        studySetId: selectedDoc.id // Using document ID instead of study set ID
      };
      
      await savePracticeExam(exam, user);
      setProgress(100);
      toast.success('Exam created successfully!');
      setTimeout(() => {
        router.push('/dashboard/exams');
      }, 1500);
    } catch (error) {
      console.error('Error creating exam:', error);
      setError(error instanceof Error ? error.message : 'Processing or saving failed');
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
                <File className="mr-2 h-5 w-5" />
                Select Document
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {documents.length === 0 ? (
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
                  <Label htmlFor="doc-select">Choose a document to generate an exam from:</Label>
                  <select
                    id="doc-select"
                    value={selectedDocId}
                    onChange={e => {
                      setSelectedDocId(e.target.value);
                      const doc = documents.find(d => d.id === e.target.value);
                      if (doc && !title) setTitle(`${doc.name} Exam`);
                    }}
                    className="w-full border rounded-lg px-3 py-2"
                  >
                    <option value="">-- Select a document --</option>
                    {documents.map(doc => (
                      <option key={doc.id} value={doc.id}>
                        {doc.name} ({Math.round(doc.size / 1024)} KB)
                      </option>
                    ))}
                  </select>
                  {selectedDoc && (
                    <div className="bg-gray-50 rounded-lg p-3 mt-2">
                      <div className="font-medium text-gray-900">{selectedDoc.name}</div>
                      <div className="text-xs text-gray-500 mb-1">{selectedDoc.type}</div>
                      <div className="text-xs text-gray-400">Created: {selectedDoc.created.toLocaleDateString()}</div>
                    </div>
                  )}
                  <div className="pt-4 text-center">
                    <Link href="/dashboard/upload">
                      <Button variant="outline" className="w-full flex items-center justify-center">
                        <Upload className="mr-2 h-4 w-4" />
                        Need to upload a document? Upload here
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
              <CardTitle>Exam Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Title Input */}
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter a title for your exam"
                  className="w-full"
                />
              </div>

              {/* Question Types Configuration */}
              <div className="space-y-6">
                <Label className="text-base">Question Types</Label>
                
                {/* Multiple Choice Questions */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="mc-count" className="text-sm">Multiple Choice: {multipleChoiceCount[0]}</Label>
                  </div>
                  <div className="px-3">
                    <Slider
                      id="mc-count"
                      min={0}
                      max={30}
                      step={1}
                      value={multipleChoiceCount}
                      onValueChange={setMultipleChoiceCount}
                      className="w-full"
                      disabled={!selectedDoc || isProcessing}
                    />
                  </div>
                  <p className="text-xs text-gray-500">
                    Questions with multiple options where only one is correct.
                  </p>
                </div>

                {/* Fill in the Blank Questions */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="fib-count" className="text-sm">Fill in the Blank: {fillInBlankCount[0]}</Label>
                  </div>
                  <div className="px-3">
                    <Slider
                      id="fib-count"
                      min={0}
                      max={20}
                      step={1}
                      value={fillInBlankCount}
                      onValueChange={setFillInBlankCount}
                      className="w-full"
                      disabled={!selectedDoc || isProcessing}
                    />
                  </div>
                  
                  {fillInBlankCount[0] > 0 && (
                    <div className="space-y-2">
                      <Label htmlFor="word-bank" className="text-xs">
                        Word Bank (Optional, comma-separated)
                      </Label>
                      <Input
                        id="word-bank"
                        value={fillInBlankWordBank}
                        onChange={(e) => setFillInBlankWordBank(e.target.value)}
                        placeholder="e.g., word1, word2, word3"
                        className="w-full"
                      />
                    </div>
                  )}
                  
                  <p className="text-xs text-gray-500">
                    Statements with missing words or phrases that you need to fill in.
                  </p>
                </div>

                {/* Short Answer Questions */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="sa-count" className="text-sm">Short Answer: {shortAnswerCount[0]}</Label>
                  </div>
                  <div className="px-3">
                    <Slider
                      id="sa-count"
                      min={0}
                      max={20}
                      step={1}
                      value={shortAnswerCount}
                      onValueChange={setShortAnswerCount}
                      className="w-full"
                      disabled={!selectedDoc || isProcessing}
                    />
                  </div>
                  <p className="text-xs text-gray-500">
                    Questions that require a brief text answer (1-2 sentences).
                  </p>
                </div>

                {/* Total Questions */}
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm font-medium text-blue-800">
                    Total: {multipleChoiceCount[0] + fillInBlankCount[0] + shortAnswerCount[0]} questions
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    Make sure you have enough content in your document for your selected question count.
                  </p>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

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
                onClick={generateExam}
                disabled={isProcessing || !selectedDoc || (multipleChoiceCount[0] + fillInBlankCount[0] + shortAnswerCount[0]) === 0}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                size="lg"
              >
                {isProcessing ? (
                  'Processing...'
                ) : (
                  <>
                    <Plus className="mr-2 h-5 w-5" />
                    Create Exam
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
