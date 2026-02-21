'use client'

import { createClient } from '@/lib/supabase/client'
import { Disc3 } from 'lucide-react'
import Link from 'next/link'
import { useState, Suspense } from 'react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

function ForgotPasswordForm() {
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const origin = window.location.origin
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${origin}/auth/callback?next=/reset-password`,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setSent(true)
    setLoading(false)
  }

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-bg-primary">
        <div className="text-center max-w-sm">
          <div className="text-4xl mb-4">📬</div>
          <h2 className="text-xl font-bold text-text-primary mb-2">Check your email</h2>
          <p className="text-text-muted text-sm">
            We sent a password reset link to <span className="text-text-primary">{email}</span>.
            Click the link in the email to set a new password.
          </p>
          <p className="text-center text-sm text-text-muted mt-6">
            <Link href="/login" className="text-accent-cyan hover:underline">
              Back to sign in
            </Link>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-bg-primary">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center gap-3 mb-8">
          <Disc3 size={40} className="text-accent-purple animate-spin-slow" />
          <h1
            className="text-xl font-bold text-text-primary"
            style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '1rem' }}
          >
            Turntable Revival
          </h1>
          <p className="text-text-muted text-sm">Reset your password</p>
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

            {error && (
              <p className="text-sm text-accent-red bg-accent-red/10 border border-accent-red/20 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <Button type="submit" loading={loading} size="lg" className="mt-2">
              Send Reset Link
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-text-muted mt-4">
          <Link href="/login" className="text-accent-cyan hover:underline">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  )
}

export default function ForgotPasswordPage() {
  return (
    <Suspense>
      <ForgotPasswordForm />
    </Suspense>
  )
}
