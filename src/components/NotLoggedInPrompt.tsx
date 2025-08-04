import Link from "next/link";
import { Button } from "./ui/button";


const NotLoggedInPrompt = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/50 py-12 px-4">
      <div className="w-full max-w-md mx-auto">
        <div className="bg-white/90 rounded-2xl shadow-xl border border-blue-100 px-8 py-10 text-center">
          <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium mb-4">
            Please Log In
          </div>
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent mb-2">
            You&apos;re not logged in
          </h1>
          <p className="text-gray-600 text-base mb-8">
            You need to be logged in to view your study sets and access your dashboard.
          </p>
          <Button asChild className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-lg py-3 h-auto font-semibold shadow-md">
            <Link href="/auth/login">Log In</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

export default NotLoggedInPrompt;