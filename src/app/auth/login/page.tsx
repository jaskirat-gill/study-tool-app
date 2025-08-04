'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { FormField } from '@/components/ui/form-field'
import { Message } from '@/components/ui/message'


export default function LoginPage() {
  const router = useRouter()
  const { signIn, user } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      router.push('/dashboard')
    }
  }, [user, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email.trim() || !password.trim()) {
      setError('Please fill in all fields')
      return
    }

    setIsLoading(true)
    setError('')

    const result = await signIn(email, password)
    
    if (result.error) {
      setError(result.error)
    } else {
      router.push('/')
    }

    setIsLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/50 py-12 px-4">
      <div className="w-full max-w-md mx-auto">
        <div className="bg-white/90 rounded-2xl shadow-xl border border-blue-100 px-8 py-10">
          <div className="text-center mb-8">
            <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium mb-4">
              Welcome back
            </div>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent mb-2">Sign in to your account</h1>
            <p className="text-gray-600 text-base">Enter your email and password to access your account</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-5">
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
              autoComplete="current-password"
              showPasswordToggle
              showPassword={showPassword}
              onTogglePassword={() => setShowPassword(!showPassword)}
            />
            {error && <Message type="error" message={error} />}
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-lg py-3 h-auto font-semibold shadow-md"
              disabled={isLoading}
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
          <div className="text-center mt-6 text-gray-600 text-sm">
            Don&apos;t have an account?{' '}
            <a href="/auth/signup" className="text-blue-700 font-medium hover:underline">Sign up</a>
          </div>
        </div>
      </div>
    </div>
  );
}
