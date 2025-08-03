'use client'

import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

export function Navigation() {
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
            <span className="text-sm text-muted-foreground">{user.email}</span>
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
