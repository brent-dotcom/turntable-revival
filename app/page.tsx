import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Disc3, Music, Users, Zap } from 'lucide-react'

export default async function HomePage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 relative overflow-hidden">
      {/* Background vinyl effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full border border-border opacity-10" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full border border-border opacity-10" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full border border-border opacity-10" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full border border-border opacity-10" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150px] h-[150px] rounded-full bg-accent-purple/5" />
        {/* Glowing orbs */}
        <div className="absolute top-20 left-20 w-64 h-64 bg-accent-purple/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-20 w-64 h-64 bg-accent-pink/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-8 text-center max-w-2xl">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <Disc3 size={48} className="text-accent-purple animate-spin-slow" />
          <div>
            <h1
              className="text-4xl font-bold tracking-tight bg-gradient-to-r from-accent-purple via-accent-pink to-accent-cyan bg-clip-text text-transparent"
              style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '1.8rem' }}
            >
              Turntable
            </h1>
            <h1
              className="text-4xl font-bold tracking-tight bg-gradient-to-r from-accent-cyan via-accent-purple to-accent-pink bg-clip-text text-transparent"
              style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '1.8rem' }}
            >
              Revival
            </h1>
          </div>
        </div>

        <p className="text-lg text-text-secondary max-w-md">
          Join a room, become the DJ, play YouTube tracks, and let the crowd vote.
          The ultimate social music experience — revival edition.
        </p>

        {/* Feature pills */}
        <div className="flex flex-wrap gap-3 justify-center">
          {[
            { icon: <Music size={14} />, text: 'YouTube Playback' },
            { icon: <Users size={14} />, text: 'Live DJ Rooms' },
            { icon: <Zap size={14} />, text: 'Real-time Voting' },
          ].map(({ icon, text }) => (
            <span
              key={text}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-bg-card border border-border text-sm text-text-secondary"
            >
              {icon} {text}
            </span>
          ))}
        </div>

        {/* CTAs */}
        <div className="flex gap-4 flex-wrap justify-center">
          <Link
            href="/rooms"
            className="px-8 py-3 bg-gradient-to-r from-accent-purple to-accent-pink text-white font-semibold rounded-xl hover:opacity-90 transition-opacity shadow-lg shadow-accent-purple/20 text-sm"
          >
            Browse Rooms
          </Link>
          {!user ? (
            <Link
              href="/signup"
              className="px-8 py-3 border border-border text-text-primary font-semibold rounded-xl hover:bg-bg-hover transition-colors text-sm"
            >
              Create Account
            </Link>
          ) : (
            <Link
              href="/rooms/create"
              className="px-8 py-3 border border-border text-text-primary font-semibold rounded-xl hover:bg-bg-hover transition-colors text-sm"
            >
              + Create Room
            </Link>
          )}
        </div>

        {user && (
          <p className="text-sm text-text-muted">
            Welcome back! Head to{' '}
            <Link href="/rooms" className="text-accent-cyan hover:underline">
              browse rooms
            </Link>{' '}
            or{' '}
            <Link href="/profile" className="text-accent-cyan hover:underline">
              customize your avatar
            </Link>
            .
          </p>
        )}
      </div>
    </main>
  )
}
