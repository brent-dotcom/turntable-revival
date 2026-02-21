'use client'

import { cn } from '@/lib/utils'
import type { VoteCounts, VoteType } from '@/types'
import { ThumbsDown, ThumbsUp } from 'lucide-react'
import { useState } from 'react'

interface VoteBarProps {
  counts: VoteCounts
  onVote: (type: VoteType) => void
  disabled?: boolean
  isDJ?: boolean
}

export default function VoteBar({ counts, onVote, disabled, isDJ }: VoteBarProps) {
  const { awesome, lame, total, awesomePercent, lamePercent, userVote } = counts
  const [clicked, setClicked] = useState<VoteType | null>(null)

  function handleVote(type: VoteType) {
    if (disabled || isDJ) return
    setClicked(type)
    setTimeout(() => setClicked(null), 400)
    onVote(type)
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Vote buttons */}
      <div className="flex items-stretch gap-3">
        {/* Awesome */}
        <button
          onClick={() => handleVote('awesome')}
          disabled={disabled || isDJ}
          className={cn(
            'flex-1 flex flex-col items-center justify-center gap-2 py-5 rounded-2xl font-bold text-base transition-all duration-200 select-none',
            'disabled:opacity-40 disabled:cursor-not-allowed',
            userVote === 'awesome'
              ? 'bg-gradient-to-br from-accent-green to-emerald-700 text-white shadow-[0_0_24px_rgba(16,185,129,0.45)] scale-[1.03]'
              : 'bg-bg-card border border-border text-text-secondary hover:border-accent-green/60 hover:text-accent-green hover:bg-accent-green/5 hover:shadow-[0_0_12px_rgba(16,185,129,0.15)]',
            !disabled && !isDJ && 'active:scale-95 cursor-pointer',
            clicked === 'awesome' && 'scale-95',
          )}
        >
          <ThumbsUp
            size={26}
            className={cn(
              'transition-transform duration-200',
              userVote === 'awesome' && 'animate-vote-awesome',
              clicked === 'awesome' && 'scale-125'
            )}
            fill={userVote === 'awesome' ? 'currentColor' : 'none'}
            strokeWidth={userVote === 'awesome' ? 0 : 2}
          />
          <span className="text-sm font-bold tracking-wide">Awesome</span>
          <span className={cn(
            'text-lg font-mono font-black leading-none',
            userVote === 'awesome' ? 'text-white' : 'text-text-muted'
          )}>
            {awesome}
          </span>
        </button>

        {/* Lame */}
        <button
          onClick={() => handleVote('lame')}
          disabled={disabled || isDJ}
          className={cn(
            'flex-1 flex flex-col items-center justify-center gap-2 py-5 rounded-2xl font-bold text-base transition-all duration-200 select-none',
            'disabled:opacity-40 disabled:cursor-not-allowed',
            userVote === 'lame'
              ? 'bg-gradient-to-br from-accent-red to-rose-700 text-white shadow-[0_0_24px_rgba(239,68,68,0.45)] scale-[1.03]'
              : 'bg-bg-card border border-border text-text-secondary hover:border-accent-red/60 hover:text-accent-red hover:bg-accent-red/5 hover:shadow-[0_0_12px_rgba(239,68,68,0.15)]',
            !disabled && !isDJ && 'active:scale-95 cursor-pointer',
            clicked === 'lame' && 'scale-95',
          )}
        >
          <ThumbsDown
            size={26}
            className={cn(
              'transition-transform duration-200',
              userVote === 'lame' && 'animate-vote-lame',
              clicked === 'lame' && 'scale-125'
            )}
            fill={userVote === 'lame' ? 'currentColor' : 'none'}
            strokeWidth={userVote === 'lame' ? 0 : 2}
          />
          <span className="text-sm font-bold tracking-wide">Lame</span>
          <span className={cn(
            'text-lg font-mono font-black leading-none',
            userVote === 'lame' ? 'text-white' : 'text-text-muted'
          )}>
            {lame}
          </span>
        </button>
      </div>

      {/* Vote bar */}
      {total > 0 && (
        <div className="flex flex-col gap-1.5">
          <div className="flex h-2.5 rounded-full overflow-hidden bg-bg-secondary gap-px">
            <div
              className="bg-gradient-to-r from-accent-green to-emerald-400 transition-all duration-700 rounded-l-full"
              style={{ width: `${awesomePercent}%` }}
            />
            <div
              className="bg-gradient-to-r from-accent-red to-rose-400 transition-all duration-700 rounded-r-full"
              style={{ width: `${lamePercent}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-text-muted">
            <span className="text-accent-green font-semibold">{awesomePercent.toFixed(0)}% 🔥</span>
            <span>{total} vote{total !== 1 ? 's' : ''}</span>
            <span className="text-accent-red font-semibold">💀 {lamePercent.toFixed(0)}%</span>
          </div>
        </div>
      )}

      {isDJ && (
        <p className="text-xs text-center text-text-muted">
          You&apos;re the DJ — your crowd is voting!
        </p>
      )}

      {disabled && !isDJ && (
        <p className="text-xs text-center text-text-muted">
          Sign in to vote
        </p>
      )}
    </div>
  )
}
