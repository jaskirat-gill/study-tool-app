'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { FormField } from '@/components/ui/form-field'
import { Message } from '@/components/ui/message'



export default function SignUpPage() {
  const router = useRouter();
  const { signUp, user } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      router.push("/");
    }
  }, [user, router]);

  const validatePassword = (pwd: string) => {
    if (pwd.length < 6) {
      return "Password must be at least 6 characters long";
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
      setError("Please fill in all fields");
      return;
    }
    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setIsLoading(true);
    setError("");
    setSuccess("");
    const result = await signUp(email, password, name.trim());
    if (result.error) {
      setError(result.error);
    } else {
      setSuccess("Account created successfully! Please check your email to verify your account before signing in.");
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/50 py-12 px-4">
      <div className="w-full max-w-md mx-auto">
        <div className="bg-white/90 rounded-2xl shadow-xl border border-blue-100 px-8 py-10">
          <div className="text-center mb-8">
            <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium mb-4">
              Sign up for StudyFlow
            </div>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent mb-2">Create your account</h1>
            <p className="text-gray-600 text-base">Sign up to start creating your study sets</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-5">
            <FormField
              id="name"
              label="Full Name"
              value={name}
              onChange={setName}
              placeholder="Enter your full name"
              required
              autoComplete="name"
            />
            <FormField
              id="email"
              label="Email"
              type="email"
              value={email}
              onChange={setEmail}
              placeholder="Enter your email"
              required
              autoComplete="email"
            />
            <FormField
              id="password"
              label="Password"
              value={password}
              onChange={setPassword}
              placeholder="Enter your password"
              required
              autoComplete="new-password"
              showPasswordToggle
              showPassword={showPassword}
              onTogglePassword={() => setShowPassword(!showPassword)}
              helperText="Must be at least 6 characters long"
            />
            <FormField
              id="confirmPassword"
              label="Confirm Password"
              value={confirmPassword}
              onChange={setConfirmPassword}
              placeholder="Confirm your password"
              required
              autoComplete="new-password"
              showPasswordToggle
              showPassword={showConfirmPassword}
              onTogglePassword={() => setShowConfirmPassword(!showConfirmPassword)}
            />
            {error && <Message type="error" message={error} />}
            {success && (
              <div className="space-y-3">
                <Message type="success" message={success} />
                <div className="text-center">
                  <Link href="/auth/login">
                    <Button variant="outline" size="sm" className="border-blue-600 text-blue-700 hover:bg-blue-50">
                      Go to Sign In
                    </Button>
                  </Link>
                </div>
              </div>
            )}
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-lg py-3 h-auto font-semibold shadow-md"
              disabled={isLoading}
            >
              {isLoading ? "Creating account..." : "Create Account"}
            </Button>
          </form>
          <div className="text-center mt-6 text-gray-600 text-sm">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-blue-700 font-medium hover:underline">Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
