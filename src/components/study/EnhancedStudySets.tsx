'use client'

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  BookOpen, 
  Upload, 
  Search, 
  Grid3X3,
  List,
  Plus,
  Clock,
  Target,
  TrendingUp,
  MoreVertical,
  Play,
  Edit,
  Trash2
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "react-hot-toast";

// Mock data for demo purposes
const mockStudySets = [
  {
    id: "1",
    title: "Biology Chapter 5 - Cell Structure",
    description: "Comprehensive study of cell organelles and their functions",
    flashcardCount: 25,
    lastStudied: "2 hours ago",
    accuracy: 87,
    createdAt: new Date("2025-01-15"),
    difficulty: "Medium",
    tags: ["Biology", "Cells", "Science"]
  },
  {
    id: "2", 
    title: "World War II History",
    description: "Key events, dates, and figures from WWII",
    flashcardCount: 40,
    lastStudied: "1 day ago",
    accuracy: 92,
    createdAt: new Date("2025-01-10"),
    difficulty: "Hard",
    tags: ["History", "WWII", "Events"]
  },
  {
    id: "3",
    title: "Spanish Vocabulary - Travel",
    description: "Essential Spanish words and phrases for traveling",
    flashcardCount: 30,
    lastStudied: "3 days ago", 
    accuracy: 75,
    createdAt: new Date("2025-01-08"),
    difficulty: "Easy",
    tags: ["Spanish", "Language", "Travel"]
  }
];

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

export default function StudySetsPage() {
  const [studySets, setStudySets] = useState(mockStudySets);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredSets, setFilteredSets] = useState(mockStudySets);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState('recent');

  useEffect(() => {
    // Filter and sort logic
    const filtered = studySets.filter(set =>
      set.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      set.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      set.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    // Sort logic
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'recent':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'accuracy':
          return b.accuracy - a.accuracy;
        case 'name':
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });

    setFilteredSets(filtered);
  }, [searchQuery, studySets, sortBy]);

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this study set?")) {
      setStudySets(prev => prev.filter(set => set.id !== id));
      toast.success('Study set deleted successfully');
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'bg-green-100 text-green-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'Hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 90) return 'text-green-600';
    if (accuracy >= 75) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Empty state
  if (studySets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <BookOpen className="h-12 w-12 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No Study Sets Yet</h2>
          <p className="text-gray-600 mb-6 max-w-md">
            Upload your first document to create AI-powered flashcards and start your learning journey!
          </p>
          <Link href="/upload">
            <Button size="lg" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
              <Upload className="mr-2 h-5 w-5" />
              Create Your First Study Set
            </Button>
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Study Sets</h1>
          <p className="text-gray-600 mt-2">
            Manage and practice with your AI-generated flashcards
          </p>
        </div>
        <Link href="/upload">
          <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
            <Plus className="mr-2 h-4 w-4" />
            New Study Set
          </Button>
        </Link>
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-6"
      >
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Sets</p>
                <p className="text-2xl font-bold text-gray-900">{studySets.length}</p>
              </div>
              <BookOpen className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Cards</p>
                <p className="text-2xl font-bold text-gray-900">
                  {studySets.reduce((acc, set) => acc + set.flashcardCount, 0)}
                </p>
              </div>
              <Target className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg. Accuracy</p>
                <p className="text-2xl font-bold text-gray-900">
                  {Math.round(studySets.reduce((acc, set) => acc + set.accuracy, 0) / studySets.length)}%
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Study Streak</p>
                <p className="text-2xl font-bold text-gray-900">7 days</p>
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Controls */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="flex flex-col sm:flex-row gap-4 items-center justify-between"
      >
        <div className="flex items-center space-x-4 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search study sets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="recent">Most Recent</option>
            <option value="accuracy">Highest Accuracy</option>
            <option value="name">Alphabetical</option>
          </select>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            <Grid3X3 className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </motion.div>

      {/* Study Sets */}
      {filteredSets.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
          <p className="text-gray-600">Try adjusting your search terms</p>
        </motion.div>
      ) : (
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className={
            viewMode === 'grid'
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              : "space-y-4"
          }
        >
          {filteredSets.map((studySet) => (
            <motion.div key={studySet.id} variants={fadeInUp}>
              <Card className="hover:shadow-lg transition-all duration-300 group">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                        {studySet.title}
                      </CardTitle>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {studySet.description}
                      </p>
                    </div>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="flex items-center space-x-2 mt-3">
                    <Badge className={getDifficultyColor(studySet.difficulty)}>
                      {studySet.difficulty}
                    </Badge>
                    {studySet.tags.slice(0, 2).map(tag => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <div className="grid grid-cols-3 gap-4 text-center border-t pt-4">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {studySet.flashcardCount}
                      </p>
                      <p className="text-xs text-gray-600">Cards</p>
                    </div>
                    <div>
                      <p className={`text-sm font-medium ${getAccuracyColor(studySet.accuracy)}`}>
                        {studySet.accuracy}%
                      </p>
                      <p className="text-xs text-gray-600">Accuracy</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {studySet.lastStudied}
                      </p>
                      <p className="text-xs text-gray-600">Last Studied</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 mt-4">
                    <Link href={`/study-sets/${studySet.id}/practice`} className="flex-1">
                      <Button className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                        <Play className="mr-2 h-4 w-4" />
                        Practice
                      </Button>
                    </Link>
                    <Button variant="outline" size="icon">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={() => handleDelete(studySet.id)}
                      className="hover:bg-red-50 hover:border-red-300 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
