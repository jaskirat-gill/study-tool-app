"use client";
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PlusCircle, BookOpen, GraduationCap } from 'lucide-react';

const quickActions = [
  {
    name: 'Upload Document',
    href: 'dashboard/upload',
    icon: PlusCircle,
    description: 'Upload your study materials and let AI do the rest.'
  },
  {
    name: 'Create Flashcards',
    href: 'dashboard/study-sets/create',
    icon: BookOpen,
    description: 'Turn your notes into smart, interactive flashcards.'
  },
  {
    name: 'Generate Exam',
    href: 'dashboard/exams/create',
    icon: GraduationCap,
    description: 'Test your knowledge with AI-generated practice exams.'
  },
];

export default function DashboardPage() {
  const { user } = useAuth();
  const displayName = user?.user_metadata?.full_name || user?.user_metadata?.name || 'there';

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <div className="mb-10 text-center">
        <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium mb-4">
          Welcome to StudyFlow
        </div>
        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent mb-2">
          Hello, {displayName}!
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Manage your study sets, notes, and more. Get started quickly with the actions below.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {quickActions.map((action) => (
          <Link key={action.name} href={action.href} className="group">
            <div className="bg-white rounded-2xl shadow-md border border-blue-100 p-6 flex flex-col items-center text-center hover:shadow-lg transition-all duration-200 h-full">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-lg flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <action.icon className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-gray-900">{action.name}</h3>
              <p className="text-gray-600 text-sm mb-4">{action.description}</p>
              <Button
                size="sm"
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-2 font-medium shadow"
              >
                {action.name}
              </Button>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}