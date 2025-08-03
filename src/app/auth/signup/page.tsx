'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { FormField } from '@/components/ui/form-field'
import { Message } from '@/components/ui/message'
import { AuthFormLayout } from '@/components/AuthFormLayout'

export default function SignUpPage() {
  const router = useRouter()
  const { signUp, user } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      router.push('/')
    }
  }, [user, router])

  const validatePassword = (pwd: string) => {
    if (pwd.length < 6) {
      return 'Password must be at least 6 characters long'
    }
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!name.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
      setError('Please fill in all fields')
      return
    }

    const passwordError = validatePassword(password)
    if (passwordError) {
      setError(passwordError)
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setIsLoading(true)
    setError('')
    setSuccess('')

    const result = await signUp(email, password, name.trim())
    
    if (result.error) {
      setError(result.error)
    } else {
      setSuccess('Account created successfully! Please check your email to verify your account before signing in.')
      // Don't automatically redirect since user needs to verify email first
    }

    setIsLoading(false)
  }

  return (
    <AuthFormLayout
      title="Create account"
      subtitle="Sign up to start creating your study sets"
      cardTitle="Sign Up"
      cardDescription="Create a new account to get started"
      linkText="Already have an account?"
      linkHref="/auth/login"
      linkLabel="Sign in"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
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
                <Button variant="outline" size="sm">
                  Go to Sign In
                </Button>
              </Link>
            </div>
          </div>
        )}

        <Button 
          type="submit" 
          className="w-full" 
          disabled={isLoading}
        >
          {isLoading ? 'Creating account...' : 'Create Account'}
        </Button>
      </form>
    </AuthFormLayout>
  )
}
