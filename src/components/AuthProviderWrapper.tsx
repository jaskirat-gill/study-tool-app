'use client'

import { AuthProvider } from "@/contexts/AuthContext";
import { Navigation } from "./Navigation";


interface AuthProviderWrapperProps {
  children: React.ReactNode;
}

export function AuthProviderWrapper({ children }: AuthProviderWrapperProps) {
  return (
    <AuthProvider>
      <Navigation />
      <main className="min-h-screen bg-background">
        {children}
      </main>
    </AuthProvider>
  );
}
