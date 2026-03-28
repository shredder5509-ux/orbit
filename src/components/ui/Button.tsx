import { ButtonHTMLAttributes, forwardRef } from 'react'
import { motion } from 'framer-motion'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'pastel'
  size?: 'sm' | 'md' | 'lg'
}

const variants = {
  primary: 'bg-accent text-white hover:bg-accent-hover shadow-sm shadow-accent/10',
  secondary: 'bg-white text-text-primary border border-border hover:bg-accent-light hover:border-text-muted/30 dark:bg-white/15 dark:text-dark-text-primary dark:border-white/20 dark:hover:bg-white/20',
  ghost: 'text-text-secondary hover:text-text-primary hover:bg-accent-light/50 dark:text-dark-text-secondary dark:hover:text-dark-text-primary',
  pastel: 'bg-pastel-blue text-text-primary hover:bg-pastel-purple/60 dark:bg-white/15 dark:text-dark-text-primary dark:hover:bg-white/20',
}

const sizes = {
  sm: 'px-3 py-1.5 text-[12px]',
  md: 'px-4 py-2 text-[13px]',
  lg: 'px-6 py-2.5 text-[13px]',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', className = '', children, ...props }, ref) => {
    return (
      <motion.button
        ref={ref}
        whileTap={{ scale: 0.97 }}
        whileHover={{ scale: 1.01 }}
        className={`
          inline-flex items-center justify-center gap-2 font-medium
          rounded-[var(--radius-md)] transition-all duration-200 cursor-pointer
          disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100
          ${variants[variant]} ${sizes[size]} ${className}
        `}
        {...(props as any)}
      >
        {children}
      </motion.button>
    )
  }
)

Button.displayName = 'Button'
