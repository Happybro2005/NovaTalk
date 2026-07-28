import { useEffect, useRef } from 'react'

interface ConstellationFieldProps {
  density?: number
  className?: string
}

/**
 * Signature element: a live constellation field.
 * Particles drift slowly; when two drift close enough, a faint line
 * is drawn between them — like a constellation forming and dissolving.
 * This ties directly to the "Constellations" theme in the brief, rather
 * than a generic particle/blob background.
 */
export default function ConstellationField({ density = 90, className = '' }: ConstellationFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let width = 0
    let height = 0
    let raf = 0

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const resize = () => {
      width = canvas.clientWidth
      height = canvas.clientHeight
      canvas.width = width * window.devicePixelRatio
      canvas.height = height * window.devicePixelRatio
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
    }

    resize()
    window.addEventListener('resize', resize)

    const count = Math.min(density, Math.floor((width * height) / 9000))
    const points = Array.from({ length: count }).map(() => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.15,
      vy: (Math.random() - 0.5) * 0.15,
      r: Math.random() * 1.3 + 0.4,
      twinkle: Math.random() * Math.PI * 2,
    }))

    const linkDist = Math.max(width, height) * 0.09

    const draw = () => {
      ctx.clearRect(0, 0, width, height)

      for (const p of points) {
        if (!prefersReducedMotion) {
          p.x += p.vx
          p.y += p.vy
          p.twinkle += 0.02
          if (p.x < 0 || p.x > width) p.vx *= -1
          if (p.y < 0 || p.y > height) p.vy *= -1
        }
      }

      for (let i = 0; i < points.length; i++) {
        for (let j = i + 1; j < points.length; j++) {
          const a = points[i]
          const b = points[j]
          const dx = a.x - b.x
          const dy = a.y - b.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < linkDist) {
            const opacity = (1 - dist / linkDist) * 0.35
            ctx.strokeStyle = `rgba(124, 158, 255, ${opacity})`
            ctx.lineWidth = 0.6
            ctx.beginPath()
            ctx.moveTo(a.x, a.y)
            ctx.lineTo(b.x, b.y)
            ctx.stroke()
          }
        }
      }

      for (const p of points) {
        const twinkleOpacity = 0.5 + Math.sin(p.twinkle) * 0.4
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255, 255, 255, ${twinkleOpacity})`
        ctx.fill()
      }

      raf = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [density])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`absolute inset-0 h-full w-full ${className}`}
    />
  )
}
