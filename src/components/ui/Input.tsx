import { InputHTMLAttributes, forwardRef } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, className = '', id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-xs font-medium text-text-muted dark:text-dark-text-secondary uppercase tracking-wide">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`
            w-full px-3 py-2 rounded-[var(--radius-md)]
            bg-white border border-border
            text-text-primary placeholder:text-text-muted
            dark:bg-dark-surface dark:border-dark-border
            dark:text-dark-text-primary
            focus:outline-none focus:border-text-primary dark:focus:border-dark-text-primary
            transition-colors text-sm
            ${className}
          `}
          {...props}
        />
      </div>
    )
  }
)

Input.displayName = 'Input'
