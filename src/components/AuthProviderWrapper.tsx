'use client'

import Link from "next/link";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

function Navigation() {
  const { user, signOut, loading } = useAuth();

  if (loading) {
    return (
      <nav className="flex space-x-4">
        <div className="animate-pulse bg-muted h-4 w-16 rounded"></div>
      </nav>
    );
  }

  return (
    <nav className="flex space-x-4 items-center">
      <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors">
        Home
      </Link>
      {user ? (
        <>
          <Link href="/upload" className="text-muted-foreground hover:text-foreground transition-colors">
            Upload
          </Link>
          <Link href="/study-sets" className="text-muted-foreground hover:text-foreground transition-colors">
            Study Sets
          </Link>
          <Link href="/notes" className="text-muted-foreground hover:text-foreground transition-colors">
            Notes
          </Link>
          <div className="flex items-center space-x-2 ml-4">
            <span className="text-sm text-muted-foreground">
              {user.user_metadata?.full_name || user.user_metadata?.name || user.email}
            </span>
            <Button variant="outline" size="sm" onClick={signOut}>
              Sign Out
            </Button>
          </div>
        </>
      ) : (
        <div className="flex space-x-2 ml-4">
          <Link href="/auth/login">
            <Button variant="outline" size="sm">
              Sign In
            </Button>
          </Link>
          <Link href="/auth/signup">
            <Button size="sm">
              Sign Up
            </Button>
          </Link>
        </div>
      )}
    </nav>
  );
}

interface AuthProviderWrapperProps {
  children: React.ReactNode;
}

export function AuthProviderWrapper({ children }: AuthProviderWrapperProps) {
  return (
    <AuthProvider>
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Study Tool</h1>
            <Navigation />
          </div>
        </div>
      </header>
      <main className="min-h-screen bg-background">
        {children}
      </main>
    </AuthProvider>
  );
}
