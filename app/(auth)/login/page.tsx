'use client'

import { createClient } from '@/lib/supabase/client'
import { Disc3 } from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState, Suspense } from 'react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirectTo') || '/rooms'
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.push(redirectTo)
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-bg-primary">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <Disc3 size={40} className="text-accent-purple animate-spin-slow" />
          <h1 className="text-xl font-bold text-text-primary" style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '1rem' }}>
            Turntable Revival
          </h1>
          <p className="text-text-muted text-sm">Sign in to drop beats</p>
        </div>

        <div className="bg-bg-card border border-border rounded-2xl p-6">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoComplete="email"
            />
            <div>
              <Input
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
              <div className="flex justify-end mt-1">
                <Link href="/forgot-password" className="text-xs text-text-muted hover:text-accent-cyan">
                  Forgot password?
                </Link>
              </div>
            </div>

            {error && (
              <p className="text-sm text-accent-red bg-accent-red/10 border border-accent-red/20 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <Button type="submit" loading={loading} size="lg" className="mt-2">
              Sign In
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-text-muted mt-4">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="text-accent-cyan hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
