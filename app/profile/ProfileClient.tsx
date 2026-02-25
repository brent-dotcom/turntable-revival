'use client'

import AvatarCustomizer from '@/components/avatar/AvatarCustomizer'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { createClient } from '@/lib/supabase/client'
import type { AvatarAccessory, AvatarHair, Profile } from '@/types'
import { Disc3, LogOut, Zap } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface ProfileClientProps {
  profile: Profile
  userEmail: string
}

export default function ProfileClient({ profile, userEmail }: ProfileClientProps) {
  const router = useRouter()
  const supabase = createClient()

  const [displayName, setDisplayName] = useState(profile.display_name ?? profile.username)
  const [savingName, setSavingName] = useState(false)
  const [savedName, setSavedName] = useState(false)

  async function handleSaveName() {
    setSavingName(true)
    await supabase
      .from('profiles')
      .update({ display_name: displayName })
      .eq('id', profile.id)
    setSavingName(false)
    setSavedName(true)
    setTimeout(() => setSavedName(false), 2000)
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-border/60 bg-bg-secondary/50 backdrop-blur-md">
        <Link href="/rooms" className="flex items-center gap-2">
          <Disc3 size={20} className="text-accent-purple animate-spin-slow" />
          <span
            className="font-bold text-text-primary"
            style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '0.7rem' }}
          >
            Turntable Revival
          </span>
        </Link>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary transition-colors"
        >
          <LogOut size={14} />
          Sign Out
        </button>
      </nav>

      <div className="max-w-lg mx-auto px-4 py-8">
        <h1 className="text-xl font-bold text-text-primary mb-6">Your Profile</h1>

        {/* DJ Stats */}
        <div className="bg-bg-card border border-border rounded-2xl p-6 mb-6">
          <h2 className="text-xs font-bold text-text-muted uppercase tracking-widest mb-4">
            DJ Stats
          </h2>
          <div className="flex items-center gap-4">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center shrink-0"
              style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.3), rgba(6,182,212,0.2))', border: '1px solid rgba(124,58,237,0.4)' }}
            >
              <Zap size={20} className="text-accent-purple" />
            </div>
            <div>
              <p className="text-3xl font-bold text-text-primary leading-none">
                {(profile.dj_points ?? 0).toLocaleString()}
              </p>
              <p className="text-xs text-text-muted mt-1">Lifetime DJ Points</p>
            </div>
            {(profile.dj_points ?? 0) === 0 && (
              <p className="ml-auto text-xs text-text-muted italic">
                DJ a room to earn points ⚡
              </p>
            )}
          </div>
        </div>

        {/* Account info */}
        <div className="bg-bg-card border border-border rounded-2xl p-6 mb-6">
          <h2 className="text-xs font-bold text-text-muted uppercase tracking-widest mb-4">
            Account
          </h2>
          <div className="flex flex-col gap-4">
            <div>
              <p className="text-xs text-text-muted mb-1">Email</p>
              <p className="text-sm text-text-primary">{userEmail}</p>
            </div>
            <div>
              <p className="text-xs text-text-muted mb-1">Username</p>
              <p className="text-sm text-text-primary font-mono">@{profile.username}</p>
            </div>
            <div className="flex gap-2">
              <Input
                label="Display Name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your display name"
                className="flex-1"
              />
              <div className="flex items-end">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleSaveName}
                  loading={savingName}
                >
                  {savedName ? '✓' : 'Save'}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Avatar customizer */}
        <div className="bg-bg-card border border-border rounded-2xl p-6">
          <h2 className="text-xs font-bold text-text-muted uppercase tracking-widest mb-4">
            Avatar
          </h2>
          <AvatarCustomizer
            userId={profile.id}
            seed={profile.username}
            initial={{
              bgColor: profile.avatar_bg_color || 'b6e3f4',
              accessory: (profile.avatar_accessory || 'none') as AvatarAccessory,
              hair: (profile.avatar_hair || 'short01') as AvatarHair,
            }}
          />
        </div>
      </div>
    </div>
  )
}
