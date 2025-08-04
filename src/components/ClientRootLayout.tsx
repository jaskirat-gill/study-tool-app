'use client';

import { AuthProvider } from "@/contexts/AuthContext";
import { Navigation } from "@/components/Navigation";
import { Toaster } from "react-hot-toast";

interface ClientRootLayoutProps {
  children: React.ReactNode;
}

export function ClientRootLayout({ children }: ClientRootLayoutProps) {
  return (
    <AuthProvider>
      <Navigation />
      <main className="min-h-screen bg-background">
        {children}
      </main>
      <Toaster position="top-right" />
    </AuthProvider>
  );
}
