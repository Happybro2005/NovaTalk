import ConstellationField from './ConstellationField'

interface AmbientBackdropProps {
  variant?: 'nebula' | 'aurora' | 'quiet'
}

export default function AmbientBackdrop({ variant = 'nebula' }: AmbientBackdropProps) {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[#050816]">
      {variant !== 'quiet' && (
        <>
          <div
            className="absolute -top-40 left-1/4 h-[520px] w-[520px] rounded-full opacity-40 blur-[120px]"
            style={{
              background:
                variant === 'aurora'
                  ? 'radial-gradient(circle, #10B981 0%, transparent 70%)'
                  : 'radial-gradient(circle, #7C3AED 0%, transparent 70%)',
            }}
          />
          <div
            className="absolute top-1/3 -right-20 h-[460px] w-[460px] rounded-full opacity-30 blur-[130px]"
            style={{
              background: 'radial-gradient(circle, #4F8CFF 0%, transparent 70%)',
            }}
          />
          <div
            className="absolute bottom-0 left-1/3 h-[400px] w-[400px] rounded-full opacity-25 blur-[110px]"
            style={{
              background: 'radial-gradient(circle, #7C3AED 0%, transparent 70%)',
            }}
          />
        </>
      )}
      <ConstellationField density={variant === 'quiet' ? 40 : 90} />
      <div className="grain absolute inset-0" />
    </div>
  )
}
