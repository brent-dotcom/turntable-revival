'use client'

import { cn } from '@/lib/utils'
import type { VoteCounts, VoteType } from '@/types'
import { ThumbsDown, ThumbsUp } from 'lucide-react'

interface VoteBarProps {
  counts: VoteCounts
  onVote: (type: VoteType) => void
  disabled?: boolean
  isDJ?: boolean
}

export default function VoteBar({ counts, onVote, disabled, isDJ }: VoteBarProps) {
  const { awesome, lame, total, awesomePercent, lamePercent, userVote } = counts

  return (
    <div className="flex flex-col gap-3">
      {/* Vote buttons */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => onVote('awesome')}
          disabled={disabled || isDJ}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 font-semibold text-sm transition-all duration-150',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            userVote === 'awesome'
              ? 'bg-accent-green/30 border-accent-green text-accent-green shadow-lg shadow-accent-green/20 scale-105'
              : 'border-border text-text-secondary hover:border-accent-green hover:text-accent-green hover:bg-accent-green/10',
            !disabled && !isDJ && 'active:scale-95 cursor-pointer'
          )}
        >
          <ThumbsUp
            size={18}
            className={cn(
              'transition-transform',
              userVote === 'awesome' && 'animate-vote-awesome'
            )}
            fill={userVote === 'awesome' ? 'currentColor' : 'none'}
          />
          <span>Awesome</span>
          <span className="font-mono text-xs opacity-70">({awesome})</span>
        </button>

        <button
          onClick={() => onVote('lame')}
          disabled={disabled || isDJ}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 font-semibold text-sm transition-all duration-150',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            userVote === 'lame'
              ? 'bg-accent-red/30 border-accent-red text-accent-red shadow-lg shadow-accent-red/20 scale-105'
              : 'border-border text-text-secondary hover:border-accent-red hover:text-accent-red hover:bg-accent-red/10',
            !disabled && !isDJ && 'active:scale-95 cursor-pointer'
          )}
        >
          <ThumbsDown
            size={18}
            className={cn(
              'transition-transform',
              userVote === 'lame' && 'animate-vote-lame'
            )}
            fill={userVote === 'lame' ? 'currentColor' : 'none'}
          />
          <span>Lame</span>
          <span className="font-mono text-xs opacity-70">({lame})</span>
        </button>
      </div>

      {/* Vote bar */}
      {total > 0 && (
        <div className="flex flex-col gap-1">
          <div className="flex h-2 rounded-full overflow-hidden bg-bg-secondary">
            <div
              className="bg-accent-green transition-all duration-500"
              style={{ width: `${awesomePercent}%` }}
            />
            <div
              className="bg-accent-red transition-all duration-500"
              style={{ width: `${lamePercent}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-text-muted">
            <span>{awesomePercent.toFixed(0)}% awesome</span>
            <span>{total} vote{total !== 1 ? 's' : ''}</span>
            <span>{lamePercent.toFixed(0)}% lame</span>
          </div>
        </div>
      )}

      {isDJ && (
        <p className="text-xs text-center text-text-muted">
          You&apos;re the DJ — your audience is voting!
        </p>
      )}
    </div>
  )
}
