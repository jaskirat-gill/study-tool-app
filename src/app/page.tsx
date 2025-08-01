import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, BookOpen, GraduationCap, Zap, FileText } from "lucide-react";

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <div className="text-center space-y-6 py-12">
        <h1 className="text-4xl font-bold tracking-tight">
          AI-Powered Study Tool
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Upload your documents and let AI generate flashcards and practice exams 
          to help you study more effectively.
        </p>
        <div className="flex justify-center space-x-4 flex-wrap gap-2">
          <Button asChild size="lg">
            <Link href="/upload">
              <Upload className="mr-2 h-4 w-4" />
              Get Started
            </Link>
          </Button>
          <Button variant="outline" asChild size="lg">
            <Link href="/study-sets">
              <BookOpen className="mr-2 h-4 w-4" />
              Browse Study Sets
            </Link>
          </Button>
          <Button variant="outline" asChild size="lg">
            <Link href="/notes/generate">
              <FileText className="mr-2 h-4 w-4" />
              Generate Notes
            </Link>
          </Button>
        </div>
      </div>

      {/* Features Section */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 py-12">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Upload className="mr-2 h-5 w-5" />
              Easy Upload
            </CardTitle>
            <CardDescription>
              Upload PDF, DOCX, or TXT files and we&apos;ll extract the content for processing.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Supports multiple file formats with automatic text extraction for seamless content processing.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Zap className="mr-2 h-5 w-5" />
              AI-Generated Flashcards
            </CardTitle>
            <CardDescription>
              Our AI analyzes your content and creates meaningful flashcards automatically.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Powered by Gemini AI to identify key concepts and create effective study materials.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <GraduationCap className="mr-2 h-5 w-5" />
              Practice Exams
            </CardTitle>
            <CardDescription>
              Generate practice exams with multiple-choice questions based on your content.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Test your knowledge with AI-generated questions that adapt to your study material.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="mr-2 h-5 w-5" />
              Study Notes
            </CardTitle>
            <CardDescription>
              Generate comprehensive review notes from any content in your clipboard.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Transform clipboard content into organized study notes with key concepts and summaries.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* How It Works Section */}
      <div className="py-12">
        <h2 className="text-3xl font-bold text-center mb-8">How It Works</h2>
        <div className="grid md:grid-cols-4 gap-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto text-xl font-bold">
              1
            </div>
            <h3 className="font-semibold">Upload Document</h3>
            <p className="text-sm text-muted-foreground">
              Upload your study material in PDF, DOCX, or TXT format
            </p>
          </div>
          <div className="text-center space-y-2">
            <div className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto text-xl font-bold">
              2
            </div>
            <h3 className="font-semibold">AI Processing</h3>
            <p className="text-sm text-muted-foreground">
              Our AI analyzes the content and identifies key concepts
            </p>
          </div>
          <div className="text-center space-y-2">
            <div className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto text-xl font-bold">
              3
            </div>
            <h3 className="font-semibold">Generate Content</h3>
            <p className="text-sm text-muted-foreground">
              Flashcards and practice questions are automatically created
            </p>
          </div>
          <div className="text-center space-y-2">
            <div className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto text-xl font-bold">
              4
            </div>
            <h3 className="font-semibold">Start Studying</h3>
            <p className="text-sm text-muted-foreground">
              Use the interactive flashcards and take practice exams
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
