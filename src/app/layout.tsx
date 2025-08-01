import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Study Tool - AI-Powered Flashcards",
  description: "Upload documents and generate AI-powered flashcards and practice exams",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold">Study Tool</h1>
              <nav className="flex space-x-4">
                <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors">
                  Home
                </Link>
                <Link href="/upload" className="text-muted-foreground hover:text-foreground transition-colors">
                  Upload
                </Link>
                <Link href="/study-sets" className="text-muted-foreground hover:text-foreground transition-colors">
                  Study Sets
                </Link>
                <Link href="/notes" className="text-muted-foreground hover:text-foreground transition-colors">
                  Notes
                </Link>
              </nav>
            </div>
          </div>
        </header>
        <main className="min-h-screen bg-background">
          {children}
        </main>
      </body>
    </html>
  );
}
