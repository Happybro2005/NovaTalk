export default function Logo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const dims = { sm: 26, md: 32, lg: 42 }
  const d = dims[size]
  return (
    <div className="flex items-center gap-2.5">
      <svg width={d} height={d} viewBox="0 0 32 32" fill="none">
        <defs>
          <linearGradient id="novaGrad" x1="0" y1="0" x2="32" y2="32">
            <stop offset="0%" stopColor="#4F8CFF" />
            <stop offset="100%" stopColor="#7C3AED" />
          </linearGradient>
        </defs>
        <circle cx="16" cy="16" r="15" stroke="url(#novaGrad)" strokeWidth="1.5" opacity="0.4" />
        <circle cx="16" cy="16" r="4.5" fill="url(#novaGrad)" />
        <circle cx="16" cy="4" r="1.6" fill="#fff" />
        <circle cx="27.5" cy="12" r="1.3" fill="#fff" opacity="0.8" />
        <circle cx="24" cy="26" r="1.1" fill="#fff" opacity="0.7" />
        <circle cx="5" cy="21" r="1.3" fill="#fff" opacity="0.8" />
        <line x1="16" y1="16" x2="16" y2="4" stroke="#fff" strokeWidth="0.6" opacity="0.4" />
        <line x1="16" y1="16" x2="27.5" y2="12" stroke="#fff" strokeWidth="0.6" opacity="0.3" />
        <line x1="16" y1="16" x2="24" y2="26" stroke="#fff" strokeWidth="0.6" opacity="0.3" />
        <line x1="16" y1="16" x2="5" y2="21" stroke="#fff" strokeWidth="0.6" opacity="0.3" />
      </svg>
      <span
        className="font-semibold tracking-tight text-white"
        style={{ fontFamily: 'var(--font-display)', fontSize: size === 'lg' ? '1.4rem' : size === 'sm' ? '1rem' : '1.2rem' }}
      >
        Nova<span className="text-gradient">Talk</span>
      </span>
    </div>
  )
}
