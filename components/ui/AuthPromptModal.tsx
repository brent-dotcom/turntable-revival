'use client'

import Modal from '@/components/ui/Modal'
import Link from 'next/link'
import { Music } from 'lucide-react'

interface AuthPromptModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function AuthPromptModal({ isOpen, onClose }: AuthPromptModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="flex flex-col items-center text-center gap-5 py-2">
        {/* Icon */}
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, var(--neon-purple), var(--neon-cyan))' }}
        >
          <Music className="w-7 h-7 text-white" />
        </div>

        {/* Copy */}
        <div>
          <h2 className="text-lg font-bold text-text-primary mb-1">Join the party</h2>
          <p className="text-sm text-text-muted leading-relaxed max-w-xs">
            Create an account to DJ, vote, and be part of the experience.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2.5 w-full">
          <Link
            href="/signup"
            onClick={onClose}
            className="w-full py-2.5 rounded-lg text-sm font-semibold text-white text-center transition-opacity hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, var(--neon-purple), var(--neon-cyan))' }}
          >
            Create Account
          </Link>
          <Link
            href="/login"
            onClick={onClose}
            className="w-full py-2.5 rounded-lg text-sm font-semibold text-center border border-border text-text-primary hover:border-neon-cyan/50 transition-colors"
          >
            Sign In
          </Link>
        </div>
      </div>
    </Modal>
  )
}
