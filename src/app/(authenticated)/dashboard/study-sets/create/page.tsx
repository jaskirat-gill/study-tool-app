"use client";

import GenerateFlashcards from "@/components/GenerateFlashCards";
import { motion } from "framer-motion";

export default function CreateStudySetPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/50 pb-16">
      <section className="container mx-auto px-4 pt-12 pb-6 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="text-center max-w-2xl mx-auto space-y-4 mb-10"
        >
          
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight bg-gradient-to-r from-gray-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent">
            Generate AI-Powered Flashcards
          </h1>
          
        </motion.div>
        <GenerateFlashcards />
      </section>
    </div>
  );
}
