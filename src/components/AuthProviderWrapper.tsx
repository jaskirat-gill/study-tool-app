'use client'

import { AuthProvider } from "@/contexts/AuthContext";
import { Navigation } from "./Navigation";


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
