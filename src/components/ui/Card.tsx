import { HTMLAttributes, forwardRef } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: 'sm' | 'md' | 'lg'
  pastel?: string
}

const paddings = {
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-5',
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ padding = 'md', pastel, className = '', children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`
          rounded-[var(--radius-lg)] transition-all duration-200
          ${pastel
            ? 'border-0'
            : 'bg-white border border-border dark:bg-black/40 dark:border-white/15 dark:backdrop-blur-lg'
          }
          ${paddings[padding]} ${className}
        `}
        style={pastel ? { backgroundColor: pastel } : undefined}
        {...props}
      >
        {children}
      </div>
    )
  }
)

Card.displayName = 'Card'
