import { type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, forwardRef } from 'react'
import { motion } from 'framer-motion'

export function GlassCard({
  children,
  className = '',
  strong = false,
}: {
  children: ReactNode
  className?: string
  strong?: boolean
}) {
  return (
    <div className={`${strong ? 'glass-strong' : 'glass'} rounded-2xl ${className}`}>
      {children}
    </div>
  )
}

export function MotionGlassCard({
  children,
  className = '',
  delay = 0,
}: {
  children: ReactNode
  className?: string
  delay?: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -6 }}
      className={`glass rounded-2xl transition-shadow hover:glow-primary ${className}`}
    >
      {children}
    </motion.div>
  )
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ children, variant = 'primary', size = 'md', className = '', ...props }, ref) => {
    const base =
      'inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4F8CFF] focus-visible:ring-offset-2 focus-visible:ring-offset-[#050816]'
    const sizes = {
      sm: 'px-3.5 py-2 text-sm',
      md: 'px-5 py-2.5 text-sm',
      lg: 'px-7 py-3.5 text-base',
    }
    const variants = {
      primary:
        'bg-gradient-to-r from-[#4F8CFF] to-[#7C3AED] text-white shadow-lg shadow-[#4F8CFF]/20 hover:shadow-[#4F8CFF]/40 hover:brightness-110 active:scale-[0.97]',
      secondary:
        'glass text-white hover:bg-white/[0.14] active:scale-[0.97]',
      ghost: 'text-[#CBD5E1] hover:text-white hover:bg-white/[0.06] active:scale-[0.97]',
      danger:
        'bg-[#EF4444]/15 text-[#EF4444] border border-[#EF4444]/30 hover:bg-[#EF4444]/25 active:scale-[0.97]',
    }
    return (
      <button ref={ref} className={`${base} ${sizes[size]} ${variants[variant]} ${className}`} {...props}>
        {children}
      </button>
    )
  }
)
Button.displayName = 'Button'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  icon?: ReactNode
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, icon, error, className = '', id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-[#CBD5E1]">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#CBD5E1]/70">
              {icon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={`w-full rounded-xl border border-white/10 bg-white/[0.05] px-4 py-2.5 text-sm text-white placeholder:text-[#CBD5E1]/40 outline-none transition-all focus:border-[#4F8CFF]/60 focus:bg-white/[0.07] focus:ring-2 focus:ring-[#4F8CFF]/20 ${icon ? 'pl-10' : ''} ${error ? 'border-[#EF4444]/60' : ''} ${className}`}
            {...props}
          />
        </div>
        {error && <p className="mt-1 text-xs text-[#EF4444]">{error}</p>}
      </div>
    )
  }
)
Input.displayName = 'Input'

export function Badge({
  children,
  tone = 'primary',
  className = '',
}: {
  children: ReactNode
  tone?: 'primary' | 'success' | 'warning' | 'danger' | 'neutral'
  className?: string
}) {
  const tones = {
    primary: 'bg-[#4F8CFF]/15 text-[#4F8CFF] border-[#4F8CFF]/25',
    success: 'bg-[#10B981]/15 text-[#10B981] border-[#10B981]/25',
    warning: 'bg-[#F59E0B]/15 text-[#F59E0B] border-[#F59E0B]/25',
    danger: 'bg-[#EF4444]/15 text-[#EF4444] border-[#EF4444]/25',
    neutral: 'bg-white/[0.06] text-[#CBD5E1] border-white/10',
  }
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium ${tones[tone]} ${className}`}>
      {children}
    </span>
  )
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return <span className="eyebrow">{children}</span>
}
