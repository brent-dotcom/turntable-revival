'use client'

import { cn } from '@/lib/utils'
import { type ButtonHTMLAttributes, forwardRef } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'awesome' | 'lame'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'inline-flex items-center justify-center gap-2 font-semibold rounded-lg transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-bg-primary disabled:opacity-50 disabled:cursor-not-allowed active:scale-95',
          {
            // Primary - purple gradient
            'bg-gradient-to-r from-accent-purple to-accent-pink text-white hover:opacity-90 focus:ring-accent-purple shadow-lg shadow-accent-purple/20':
              variant === 'primary',
            // Secondary - outlined
            'border border-border-bright text-text-primary hover:bg-bg-hover focus:ring-border-bright':
              variant === 'secondary',
            // Ghost - minimal
            'text-text-secondary hover:text-text-primary hover:bg-bg-hover focus:ring-border-bright':
              variant === 'ghost',
            // Danger or Lame - red
            'bg-accent-red/20 text-accent-red border border-accent-red/40 hover:bg-accent-red/30 focus:ring-accent-red':
              variant === 'danger' || variant === 'lame',
            // Awesome - green teal
            'bg-accent-green/20 text-accent-green border border-accent-green/40 hover:bg-accent-green/30 focus:ring-accent-green':
              variant === 'awesome',
          },
          {
            'px-3 py-1.5 text-sm': size === 'sm',
            'px-4 py-2 text-sm': size === 'md',
            'px-6 py-3 text-base': size === 'lg',
          },
          className
        )}
        {...props}
      >
        {loading ? (
          <>
            <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            {children}
          </>
        ) : children}
      </button>
    )
  }
)

Button.displayName = 'Button'
export default Button
