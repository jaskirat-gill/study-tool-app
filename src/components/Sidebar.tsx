'use client'

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { 
  Home,
  Upload, 
  BookOpen, 
  GraduationCap, 
  FileText, 
  Settings,
  LogOut,
  User,
} from 'lucide-react';
import { motion } from 'framer-motion';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Upload', href: '/dashboard/upload', icon: Upload },
  { name: 'Flashcards', href: '/dashboard/study-sets', icon: BookOpen },
  { name: 'Exams', href: '/dashboard/exams', icon: GraduationCap },
  { name: 'Notes', href: '/dashboard/notes', icon: FileText },
];


export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  return (
    <motion.div 
      initial={{ x: -264 }}
      animate={{ x: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 shadow-lg"
    >
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="flex items-center px-6 py-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              StudyFlow
            </span>
          </div>
        </div>

        {/* User Info */}
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-full flex items-center justify-center">
              <User className="h-5 w-5 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.user_metadata?.full_name || user?.user_metadata?.name || 'User'}
              </p>
              <p className="text-sm text-gray-500 truncate">
                {user?.email}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-6 py-4 space-y-1">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Navigation
          </h3>
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link key={item.name} href={item.href}>
                <motion.div
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm'
                      : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'
                  }`}
                >
                  <item.icon className={`h-5 w-5 mr-3 ${isActive ? 'text-white' : ''}`} />
                  {item.name}
                </motion.div>
              </Link>
            );
          })}
        </nav>


        {/* Bottom Actions */}
        <div className="px-6 py-4 border-t border-gray-200 space-y-2">
          <Button 
            variant="ghost" 
            size="sm" 
            className="w-full justify-start text-gray-600 hover:text-gray-800"
          >
            <Settings className="h-4 w-4 mr-3" />
            Settings
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleSignOut}
            className="w-full justify-start text-gray-600 hover:text-red-600 hover:bg-red-50"
          >
            <LogOut className="h-4 w-4 mr-3" />
            Sign Out
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
