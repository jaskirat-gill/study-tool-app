'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Calendar,
  Clock,
  FileText,
  Trash2,
  Download,
  Copy
} from 'lucide-react';
import { getStudyNote, deleteStudyNote } from '@/lib/storage';
import { StudyNotes } from '@/types';

export default function StudyNotePage() {
  const params = useParams();
  const router = useRouter();
  const [studyNote, setStudyNote] = useState<StudyNotes | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (params.id) {
      const note = getStudyNote(params.id as string);
      if (note) {
        setStudyNote(note);
      } else {
        router.push('/notes');
      }
    }
  }, [params.id, router]);

  const handleDelete = async () => {
    if (!studyNote || isDeleting) return;

    const confirmed = window.confirm('Are you sure you want to delete these notes? This action cannot be undone.');
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      deleteStudyNote(studyNote.id);
      router.push('/notes');
    } catch (error) {
      console.error('Error deleting notes:', error);
      setIsDeleting(false);
    }
  };

  const handleCopyContent = async () => {
    if (!studyNote) return;

    try {
      await navigator.clipboard.writeText(studyNote.content);
      // You might want to show a toast notification here
      console.log('Notes copied to clipboard');
    } catch (error) {
      console.error('Failed to copy notes:', error);
    }
  };

  const handleDownload = async () => {
    if (!studyNote) return;

    try {
      // Dynamically import jsPDF to avoid SSR issues
      const jsPDFModule = await import('jspdf');
      const jsPDF = jsPDFModule.default;
      
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 20;
      const maxWidth = pageWidth - 2 * margin;
      
      // Set initial position
      let yPosition = margin;
      
      // Add title
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      const titleLines = pdf.splitTextToSize(studyNote.title, maxWidth);
      pdf.text(titleLines, margin, yPosition);
      yPosition += titleLines.length * 8 + 10;
      
      // Add creation date
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(100);
      pdf.text(`Created: ${formatDate(studyNote.created)}`, margin, yPosition);
      yPosition += 15;
      
      // Reset text color for content
      pdf.setTextColor(0);
      
      // Process content line by line
      const lines = studyNote.content.split('\n');
      
      for (const line of lines) {
        // Check if we need a new page
        if (yPosition > pageHeight - margin) {
          pdf.addPage();
          yPosition = margin;
        }
        
        if (line.trim() === '') {
          yPosition += 5; // Add some space for empty lines
          continue;
        }
        
        // Handle headers
        if (line.startsWith('# ')) {
          pdf.setFontSize(14);
          pdf.setFont('helvetica', 'bold');
          const headerText = line.slice(2);
          const headerLines = pdf.splitTextToSize(headerText, maxWidth);
          pdf.text(headerLines, margin, yPosition);
          yPosition += headerLines.length * 7 + 8;
        } else if (line.startsWith('## ')) {
          pdf.setFontSize(12);
          pdf.setFont('helvetica', 'bold');
          const headerText = line.slice(3);
          const headerLines = pdf.splitTextToSize(headerText, maxWidth);
          pdf.text(headerLines, margin, yPosition);
          yPosition += headerLines.length * 6 + 6;
        } else if (line.startsWith('### ')) {
          pdf.setFontSize(11);
          pdf.setFont('helvetica', 'bold');
          const headerText = line.slice(4);
          const headerLines = pdf.splitTextToSize(headerText, maxWidth);
          pdf.text(headerLines, margin, yPosition);
          yPosition += headerLines.length * 6 + 4;
        } else if (line.startsWith('- ') || line.startsWith('* ')) {
          // Handle bullet points
          pdf.setFontSize(10);
          pdf.setFont('helvetica', 'normal');
          const bulletText = line.slice(2);
          const bulletLines = pdf.splitTextToSize(`• ${bulletText}`, maxWidth - 10);
          pdf.text(bulletLines, margin + 10, yPosition);
          yPosition += bulletLines.length * 5 + 2;
        } else if (/^\d+\.\s/.test(line)) {
          // Handle numbered lists
          pdf.setFontSize(10);
          pdf.setFont('helvetica', 'normal');
          const listText = line;
          const listLines = pdf.splitTextToSize(listText, maxWidth - 10);
          pdf.text(listLines, margin + 10, yPosition);
          yPosition += listLines.length * 5 + 2;
        } else if (line.trim() === '---') {
          // Handle horizontal rules
          yPosition += 5;
          pdf.setLineWidth(0.5);
          pdf.line(margin, yPosition, pageWidth - margin, yPosition);
          yPosition += 5;
        } else {
          // Handle regular paragraphs
          pdf.setFontSize(10);
          pdf.setFont('helvetica', 'normal');
          
          // Handle bold text (simple **text** format)
          if (line.includes('**')) {
            const parts = line.split('**');
            let currentX = margin;
            
            for (let i = 0; i < parts.length; i++) {
              if (parts[i]) {
                if (i % 2 === 1) {
                  pdf.setFont('helvetica', 'bold');
                } else {
                  pdf.setFont('helvetica', 'normal');
                }
                
                const textWidth = pdf.getTextWidth(parts[i]);
                if (currentX + textWidth > pageWidth - margin) {
                  yPosition += 5;
                  currentX = margin;
                }
                
                pdf.text(parts[i], currentX, yPosition);
                currentX += textWidth;
              }
            }
            yPosition += 7;
          } else {
            const textLines = pdf.splitTextToSize(line, maxWidth);
            pdf.text(textLines, margin, yPosition);
            yPosition += textLines.length * 5 + 3;
          }
        }
      }
      
      // Save the PDF
      pdf.save(`${studyNote.title}.pdf`);
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      // Fallback to text download
      const element = document.createElement('a');
      const file = new Blob([studyNote.content], { type: 'text/plain' });
      element.href = URL.createObjectURL(file);
      element.download = `${studyNote.title}.txt`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const renderMarkdown = (content: string) => {
    // Simple markdown rendering for basic formatting
    return content
      .split('\n')
      .map((line, index) => {
        // Headers
        if (line.startsWith('# ')) {
          return <h1 key={index} className="text-2xl font-bold mt-6 mb-3">{line.slice(2)}</h1>;
        }
        if (line.startsWith('## ')) {
          return <h2 key={index} className="text-xl font-semibold mt-5 mb-2">{line.slice(3)}</h2>;
        }
        if (line.startsWith('### ')) {
          return <h3 key={index} className="text-lg font-medium mt-4 mb-2">{line.slice(4)}</h3>;
        }
        
        // Bullet points
        if (line.startsWith('- ') || line.startsWith('* ')) {
          return <li key={index} className="ml-4 mb-1">{line.slice(2)}</li>;
        }
        
        // Numbered lists
        if (/^\d+\.\s/.test(line)) {
          return <li key={index} className="ml-4 mb-1">{line.replace(/^\d+\.\s/, '')}</li>;
        }
        
        // Bold text (simple **text** format)
        if (line.includes('**')) {
          const parts = line.split('**');
          return (
            <p key={index} className="mb-2">
              {parts.map((part, i) => i % 2 === 1 ? <strong key={i}>{part}</strong> : part)}
            </p>
          );
        }
        
        // Horizontal rule
        if (line.trim() === '---') {
          return <hr key={index} className="my-4 border-border" />;
        }
        
        // Empty lines
        if (line.trim() === '') {
          return <br key={index} />;
        }
        
        // Regular paragraphs
        return <p key={index} className="mb-2">{line}</p>;
      });
  };

  if (!studyNote) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <p>Loading notes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" asChild>
            <Link href="/notes">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Notes
            </Link>
          </Button>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyContent}
            >
              <Copy className="h-4 w-4 mr-2" />
              Copy
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
            >
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </div>

        {/* Notes Header */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <CardTitle className="text-2xl">{studyNote.title}</CardTitle>
                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-4 w-4" />
                    <span>Created {formatDate(studyNote.created)}</span>
                  </div>
                  {studyNote.lastModified.getTime() !== studyNote.created.getTime() && (
                    <div className="flex items-center space-x-1">
                      <Clock className="h-4 w-4" />
                      <span>Modified {formatDate(studyNote.lastModified)}</span>
                    </div>
                  )}
                </div>
              </div>
              <Badge variant="outline" className="flex items-center">
                <FileText className="h-3 w-3 mr-1" />
                Study Notes
              </Badge>
            </div>
          </CardHeader>
        </Card>

        {/* Notes Content */}
        <Card>
          <CardContent className="pt-6">
            <div className="prose prose-sm max-w-none">
              {renderMarkdown(studyNote.content)}
            </div>
          </CardContent>
        </Card>

        {/* Source Content (if available) */}
        {studyNote.sourceContent && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Source Content</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-muted rounded-lg p-4 max-h-60 overflow-y-auto">
                <pre className="text-sm whitespace-pre-wrap font-mono">
                  {studyNote.sourceContent}
                </pre>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
