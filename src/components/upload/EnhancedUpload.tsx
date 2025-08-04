'use client'

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
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
  X,
  Paperclip,
  FileImage,
  Plus
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "react-hot-toast";

export default function UploadPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [flashcardCount, setFlashcardCount] = useState([15]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isDragOver, setIsDragOver] = useState(false);
  const [clipboardContent, setClipboardContent] = useState("");

  const validateFile = (file: File) => {
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'application/msword'
    ];
    
    if (!allowedTypes.includes(file.type)) {
      throw new Error('Please select a valid file type (PDF, DOCX, or TXT)');
    }
    
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new Error('File size must be less than 10MB');
    }
  };

  const handleFileSelect = useCallback((selectedFile: File) => {
    try {
      validateFile(selectedFile);
      setFile(selectedFile);
      
      // Auto-generate title from filename if empty
      if (!title) {
        const fileName = selectedFile.name.replace(/\.[^/.]+$/, "");
        setTitle(fileName);
      }
      
      toast.success('File selected successfully!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'File validation failed');
    }
  }, [title]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFileSelect(selectedFile);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleClipboardPaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text.trim()) {
        setClipboardContent(text);
        if (!title) {
          setTitle("Clipboard Content");
        }
        toast.success('Clipboard content loaded!');
      } else {
        toast.error('Clipboard is empty');
      }
    } catch {
      toast.error('Failed to read clipboard');
    }
  };

  const processContent = async () => {
    if (!title.trim()) {
      toast.error('Please provide a title');
      return;
    }

    if (!file && !clipboardContent.trim()) {
      toast.error('Please select a file or paste clipboard content');
      return;
    }

    setIsProcessing(true);
    setProgress(0);

    try {
      let extractedText = "";
      
      if (file) {
        // Process file upload
        setProgress(25);
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await fetch('/api/process-document', {
          method: 'POST',
          body: formData,
        });
        
        if (!response.ok) {
          throw new Error('Failed to process document');
        }
        
        const result = await response.json();
        extractedText = result.content;
      } else {
        // Use clipboard content
        extractedText = clipboardContent;
      }

      setProgress(50);
      
      // Generate flashcards
      const flashcardsResponse = await fetch('/api/generate-flashcards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: extractedText,
          count: flashcardCount[0]
        }),
      });

      if (!flashcardsResponse.ok) {
        throw new Error('Failed to generate flashcards');
      }

      await flashcardsResponse.json();
      setProgress(100);

      // Here you would save the study set to your storage
      toast.success('Study set created successfully!');
      
      // Redirect to the created study set
      setTimeout(() => {
        router.push('/study-sets');
      }, 1500);

    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Processing failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const removeFile = () => {
    setFile(null);
    setTitle("");
  };

  const removeClipboardContent = () => {
    setClipboardContent("");
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h1 className="text-3xl font-bold text-gray-900">Upload Study Material</h1>
        <p className="text-gray-600 mt-2">
          Upload documents or paste content to generate AI-powered flashcards and study materials.
        </p>
      </motion.div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Upload Section */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Upload className="mr-2 h-5 w-5" />
                Document Upload
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* File Drop Zone */}
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-300 ${
                  isDragOver
                    ? 'border-blue-500 bg-blue-50'
                    : file
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                {file ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-center">
                      <FileText className="h-12 w-12 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{file.name}</p>
                      <p className="text-sm text-gray-500">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={removeFile}
                      className="mt-2"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Remove
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-center">
                      <Upload className="h-12 w-12 text-gray-400" />
                    </div>
                    <div>
                      <p className="text-lg font-medium text-gray-900">
                        Drag and drop your file here
                      </p>
                      <p className="text-gray-500">or click to browse</p>
                      <p className="text-sm text-gray-400 mt-2">
                        Supports PDF, DOCX, and TXT files (max 10MB)
                      </p>
                    </div>
                    <div>
                      <input
                        type="file"
                        id="file-upload"
                        className="hidden"
                        accept=".pdf,.docx,.txt,.doc"
                        onChange={handleFileChange}
                      />
                      <Label htmlFor="file-upload">
                        <Button variant="outline" className="cursor-pointer">
                          <FileImage className="mr-2 h-4 w-4" />
                          Choose File
                        </Button>
                      </Label>
                    </div>
                  </div>
                )}
              </div>

              {/* Clipboard Section */}
              <div className="border-t pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium text-gray-900">Or paste from clipboard</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClipboardPaste}
                  >
                    <Paperclip className="h-4 w-4 mr-2" />
                    Paste
                  </Button>
                </div>
                
                {clipboardContent && (
                  <div className="space-y-2">
                    <div className="p-3 bg-gray-50 rounded-lg max-h-32 overflow-y-auto">
                      <p className="text-sm text-gray-700 line-clamp-4">
                        {clipboardContent.substring(0, 200)}...
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={removeClipboardContent}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Clear
                    </Button>
                  </div>
                )}
              </div>
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
                disabled={isProcessing || (!file && !clipboardContent)}
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
