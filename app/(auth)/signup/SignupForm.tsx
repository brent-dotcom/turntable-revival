'use client'

import { createClient } from '@/lib/supabase/client'
import { Disc3 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

export default function SignupPage() {
  const router = useRouter()
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [needsConfirmation, setNeedsConfirmation] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (username.length < 3) {
      setError('Username must be at least 3 characters')
      setLoading(false)
      return
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setError('Username can only contain letters, numbers, and underscores')
      setLoading(false)
      return
    }

    // Check username availability
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username.toLowerCase())
      .maybeSingle()

    if (existing) {
      setError('Username already taken')
      setLoading(false)
      return
    }

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: username.toLowerCase(),
          display_name: username,
        },
      },
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)

    // Auto sign in (succeeds when email confirmation is disabled)
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (!signInError) {
      router.push('/rooms')
      router.refresh()
    } else {
      // Email confirmation required — show prompt instead of freezing
      setNeedsConfirmation(true)
    }
  }

  if (success && needsConfirmation) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-bg-primary">
        <div className="text-center max-w-sm">
          <div className="text-4xl mb-4">📬</div>
          <h2 className="text-xl font-bold text-text-primary mb-2">Check your email</h2>
          <p className="text-text-muted text-sm mb-4">
            We sent a confirmation link to <span className="text-text-primary">{email}</span>.
            Click it to activate your account, then sign in.
          </p>
          <Link href="/login" className="text-accent-cyan hover:underline text-sm">
            Go to sign in →
          </Link>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-bg-primary">
        <div className="text-center max-w-sm">
          <div className="text-4xl mb-4">🎵</div>
          <h2 className="text-xl font-bold text-text-primary mb-2">You&apos;re in!</h2>
          <p className="text-text-muted text-sm">Redirecting to the rooms...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-bg-primary">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <Disc3 size={40} className="text-accent-purple animate-spin-slow" />
          <h1
            className="text-xl font-bold text-text-primary"
            style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '1rem' }}
          >
            Turntable Revival
          </h1>
          <p className="text-text-muted text-sm">Create your DJ account</p>
        </div>

        <div className="bg-bg-card border border-border rounded-2xl p-6">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              label="Username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="coolDJ99"
              required
              hint="Letters, numbers, and underscores only"
              autoComplete="username"
            />
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoComplete="email"
            />
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              hint="At least 6 characters"
              autoComplete="new-password"
            />

            {error && (
              <p className="text-sm text-accent-red bg-accent-red/10 border border-accent-red/20 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <Button type="submit" loading={loading} size="lg" className="mt-2">
              Create Account
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-text-muted mt-4">
          Already have an account?{' '}
          <Link href="/login" className="text-accent-cyan hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
