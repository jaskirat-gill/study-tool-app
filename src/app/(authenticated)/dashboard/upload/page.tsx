"use client";

import { useState, useCallback, useEffect, useRef } from "react";
  // Ref for file input
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
  Upload,
  FileText,
  AlertCircle,
  CheckCircle,
  Paperclip,
  FileImage,
  X,
  Plus,
  Trash2,
  FileQuestion,
  Clock,
} from "lucide-react";
import { 
  saveDocumentUpload, 
  getDocumentUploads, 
  deleteDocumentUpload, 
} from "@/lib/storage";
import { DocumentUpload } from "@/types";
import { generateId } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import NotLoggedInPrompt from "@/components/NotLoggedInPrompt";
import { motion } from "framer-motion";
import { toast } from "react-hot-toast";
import { PageHeader } from "@/components/PageHeader";
import Link from "next/link";

export default function UploadPage() {
  const { user } = useAuth();
  // Ref for file input
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // File Upload State
  const [files, setFiles] = useState<File[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  
  // Clipboard State
  const [clipboardContent, setClipboardContent] = useState("");
  
  // Document State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [documents, setDocuments] = useState<DocumentUpload[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load existing documents function
  const loadDocuments = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const docs = await getDocumentUploads(user);
      setDocuments(docs);
    } catch (error) {
      toast.error("Failed to load documents");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Effect to load documents on mount and when user changes
  useEffect(() => {
    if (user) {
      loadDocuments();
    }
  }, [user, loadDocuments]);

  const validateFile = (file: File) => {
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'application/msword'
    ];
    
    if (!allowedTypes.includes(file.type)) {
      throw new Error('Please select valid file types (PDF, DOCX, or TXT)');
    }
    
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new Error('File size must be less than 10MB');
    }
  };

  const handleFileSelect = useCallback((selectedFiles: File[]) => {
    try {
      // Validate each file
      selectedFiles.forEach(file => validateFile(file));
      
      // Add new files to existing files array
      setFiles(prev => [...prev, ...selectedFiles]);
      
      // Auto-generate title from first filename if empty
      if (!title && selectedFiles.length > 0) {
        const fileName = selectedFiles[0].name.replace(/\.[^/.]+$/, "");
        setTitle(fileName + (selectedFiles.length > 1 ? ` + ${selectedFiles.length - 1} more` : ""));
      }
      
      toast.success(`${selectedFiles.length} file${selectedFiles.length > 1 ? 's' : ''} selected successfully!`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'File validation failed');
    }
  }, [title]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (selectedFiles && selectedFiles.length > 0) {
      handleFileSelect(Array.from(selectedFiles));
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (e.dataTransfer.files.length > 0) {
      const droppedFiles = Array.from(e.dataTransfer.files);
      handleFileSelect(droppedFiles);
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
          // Create a title from the first few words
          const words = text.trim().split(/\s+/).slice(0, 5);
          setTitle(words.join(" ") + (words.length === 5 ? "..." : ""));
        }
        toast.success('Clipboard content loaded!');
      } else {
        toast.error('Clipboard is empty');
      }
    } catch {
      toast.error('Failed to read clipboard');
    }
  };

  const removeFile = (index?: number) => {
    if (index !== undefined) {
      // Remove specific file
      setFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
    } else {
      // Remove all files
      setFiles([]);
      // Only reset title if it was auto-generated
      if (title && files.length > 0) {
        const firstFileName = files[0].name.replace(/\.[^/.]+$/, "");
        const generatedTitle = firstFileName + (files.length > 1 ? ` + ${files.length - 1} more` : "");
        if (title === generatedTitle) {
          setTitle("");
        }
      }
    }
  };

  const removeClipboardContent = () => {
    setClipboardContent("");
  };

  const resetForm = () => {
    setFiles([]);
    setClipboardContent("");
    setTitle("");
    setDescription("");
    setError("");
    setSuccess("");
    setProgress(0);
  };
  
  const handleDeleteDocument = async (docId: string) => {
    if (!user) return;
    
    if (confirm("Are you sure you want to delete this document?")) {
      try {
        await deleteDocumentUpload(docId, user);
        toast.success("Document deleted successfully");
        // Refresh the documents list
        loadDocuments();
      } catch (error) {
        toast.error("Failed to delete document");
        console.error(error);
      }
    }
  };

  const formatFileSize = (sizeInBytes: number): string => {
    if (sizeInBytes < 1024) {
      return `${sizeInBytes} B`;
    } else if (sizeInBytes < 1024 * 1024) {
      return `${(sizeInBytes / 1024).toFixed(1)} KB`;
    } else {
      return `${(sizeInBytes / (1024 * 1024)).toFixed(1)} MB`;
    }
  };

  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  };

  if (!user) {
    return <NotLoggedInPrompt />;
  }

  const processUpload = async () => {
    if (!title.trim()) {
      toast.error('Please provide a title');
      return;
    }

    if (files.length === 0 && !clipboardContent.trim()) {
      toast.error('Please select files or paste clipboard content');
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    setError("");
    setSuccess("");

    try {
      let content = "";
      let documentName = title;
      let documentType = "text/plain";
      let documentSize = 0;

      if (files.length > 0) {
        // Process file uploads
        setProgress(10);
        // Process each file sequentially and concatenate contents
        let combinedContent = "";
        let totalSize = 0;
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const formData = new FormData();
          formData.append('file', file);
          const response = await fetch('/api/process-document', {
            method: 'POST',
            body: formData,
          });
          if (!response.ok) {
            throw new Error(`Failed to process document ${file.name}`);
          }
          const result = await response.json();
          // Add file name as a header if there are multiple files
          if (files.length > 1) {
            combinedContent += `\n\n==== ${file.name} ====\n\n`;
          }
          combinedContent += result.content;
          totalSize += file.size;
          // Update progress for each file
          setProgress(10 + Math.round((i + 1) / files.length * 50));
        }
        content = combinedContent;
        // Only set documentName if the user did not provide a title
        if (!title || !title.trim()) {
          documentName = files.length === 1 ? files[0].name : `${files.length} Combined Documents`;
        }
        documentType = files.length === 1 ? files[0].type : "text/plain";
        documentSize = totalSize;
      } else {
        // Use clipboard content
        content = clipboardContent;
        documentSize = new Blob([clipboardContent]).size;
      }

      setProgress(60);
      
      // Create document upload object
      const documentUpload: DocumentUpload = {
        id: generateId(),
        name: documentName,
        type: documentType,
        size: documentSize,
        content: content,
        description: description.trim() || undefined,
        created: new Date(),
        lastModified: new Date(),
      };

      // Save to Supabase
      await saveDocumentUpload(documentUpload, user);
      
      setProgress(100);
      setSuccess('Document uploaded successfully!');
      toast.success('Document uploaded successfully!');
      
      // Refresh the documents list
      await loadDocuments();
      
      // Reset the form after successful upload
      resetForm();
      
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Processing failed');
      toast.error(error instanceof Error ? error.message : 'Processing failed');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Document Upload"
        subtitle="Upload documents or paste content for later use in creating study materials."
      />

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
                Upload Document
              </CardTitle>
              <CardDescription>
                Upload a document or paste content from your clipboard
              </CardDescription>
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
                    : files.length > 0
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                {/* Always render the file input, but keep it hidden */}
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept=".pdf,.docx,.txt,.doc"
                  onChange={handleFileChange}
                  multiple
                  tabIndex={-1}
                  aria-hidden="true"
                />

                {files.length > 0 ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-center">
                      <FileText className="h-12 w-12 text-green-600" />
                    </div>
                    <div className="max-h-48 overflow-y-auto">
                      {files.map((file, index) => (
                        <div key={index} className="flex items-center justify-between mb-2 p-2 bg-white rounded-lg">
                          <div className="flex items-center">
                            <FileText className="h-4 w-4 text-blue-600 mr-2" />
                            <div className="text-left">
                              <p className="font-medium text-sm text-gray-900 truncate max-w-[200px]">{file.name}</p>
                              <p className="text-xs text-gray-500">
                                {formatFileSize(file.size)}
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFile(index)}
                            className="h-8 w-8 p-0"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2 justify-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeFile()}
                        className="mt-2"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Remove All
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        className="mt-2"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add More
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-center">
                      <Upload className="h-12 w-12 text-gray-400" />
                    </div>
                    <div>
                      <p className="text-lg font-medium text-gray-900">
                        Drag and drop your files here
                      </p>
                      <p className="text-gray-500">or click to browse</p>
                      <p className="text-sm text-gray-400 mt-2">
                        Supports PDF, DOCX, and TXT files (max 10MB each)
                      </p>
                    </div>
                    <div className="flex justify-center">
                      <Label className="flex flex-col items-center cursor-pointer">
                        <Button
                          variant="outline"
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <FileImage className="mr-2 h-4 w-4" />
                          Choose Files
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
              <CardTitle>Document Details</CardTitle>
              <CardDescription>
                Provide details about the document you&apos;re uploading
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Title Input */}
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter a title for your document"
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
                  placeholder="Add a description for your document"
                  className="w-full"
                  rows={3}
                />
              </div>

              {/* Error Message */}
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Success Message */}
              {success && (
                <Alert className="bg-green-50 text-green-800 border-green-200">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription>{success}</AlertDescription>
                </Alert>
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

              {/* Action Buttons */}
              <div className="flex space-x-3 pt-4">
                <Button
                  variant="outline"
                  onClick={resetForm}
                  disabled={isProcessing}
                  className="flex-1"
                >
                  Reset
                </Button>
                <Button
                  onClick={processUpload}
                  disabled={isProcessing || (!files && !clipboardContent) || !title.trim()}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                >
                  {isProcessing ? (
                    'Processing...'
                  ) : (
                    <>
                      <Plus className="mr-2 h-5 w-5" />
                      Upload
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Document List Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="mr-2 h-5 w-5" />
            Your Documents
          </CardTitle>
          <CardDescription>
            Manage your uploaded documents and use them to create study materials
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-8 text-center text-muted-foreground">
              <div className="animate-spin w-8 h-8 border-t-2 border-b-2 border-blue-600 rounded-full mx-auto mb-4"></div>
              <p>Loading your documents...</p>
            </div>
          ) : documents.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              <FileQuestion className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-medium">No documents yet</p>
              <p className="max-w-md mx-auto mt-2">
                Upload your first document using the form above to get started.
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {documents.map((doc) => (
                <div key={doc.id} className="py-4 flex flex-col md:flex-row md:items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center">
                      <FileText className="h-5 w-5 mr-3 text-blue-600 flex-shrink-0" />
                      <h3 className="font-medium text-gray-900 truncate">{doc.name}</h3>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-2 items-center text-sm text-gray-500">
                      <span className="flex items-center">
                        <Clock className="h-3.5 w-3.5 mr-1" />
                        {formatDate(doc.created)}
                      </span>
                      <span>•</span>
                      <span>{formatFileSize(doc.size)}</span>
                      {doc.description && (
                        <>
                          <span>•</span>
                          <span className="truncate max-w-[200px]">{doc.description}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex space-x-2 mt-2 md:mt-0">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDeleteDocument(doc.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                    <Link href={`/dashboard/study-sets/generate?documentId=${doc.id}`}>
                      <Button 
                        size="sm"
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Create Study Set
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
