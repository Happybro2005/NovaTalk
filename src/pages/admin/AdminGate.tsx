import { useState, useRef, type KeyboardEvent, type ClipboardEvent } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { ShieldAlert, KeyRound } from 'lucide-react'
import AmbientBackdrop from '../../components/AmbientBackdrop'
import { Button } from '../../components/ui'

const PASSCODE_LENGTH = 6

export default function AdminGate() {
  const [digits, setDigits] = useState<string[]>(Array(PASSCODE_LENGTH).fill(''))
  const [error, setError] = useState(false)
  const inputsRef = useRef<(HTMLInputElement | null)[]>([])
  const navigate = useNavigate()

  const handleChange = (value: string, index: number) => {
    if (!/^\d*$/.test(value)) return
    const next = [...digits]
    next[index] = value.slice(-1)
    setDigits(next)
    setError(false)
    if (value && index < PASSCODE_LENGTH - 1) {
      inputsRef.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, PASSCODE_LENGTH)
    const next = Array(PASSCODE_LENGTH).fill('')
    pasted.split('').forEach((d, i) => (next[i] = d))
    setDigits(next)
    inputsRef.current[Math.min(pasted.length, PASSCODE_LENGTH - 1)]?.focus()
  }

  const handleSubmit = () => {
    const code = digits.join('')
    // Placeholder-only check for visual demo purposes — no real auth logic here.
    if (code.length === PASSCODE_LENGTH) {
      navigate('/admin/dashboard')
    } else {
      setError(true)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4">
      <AmbientBackdrop variant="aurora" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="glass-strong glow-accent w-full max-w-md rounded-2xl p-8 text-center"
      >
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#7C3AED]/20 text-[#7C3AED]">
          <ShieldAlert size={26} />
        </div>
        <p className="eyebrow mt-5">MISSION CONTROL</p>
        <h1 className="mt-2 text-2xl font-semibold text-white" style={{ fontFamily: 'var(--font-display)' }}>
          Enter access passcode
        </h1>
        <p className="mt-2 text-sm text-[#CBD5E1]">
          This console is restricted. Enter the {PASSCODE_LENGTH}-digit operator passcode to continue — no separate admin account needed.
        </p>

        <div className="mt-7 flex justify-center gap-2.5">
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el) => { inputsRef.current[i] = el }}
              value={d}
              onChange={(e) => handleChange(e.target.value, i)}
              onKeyDown={(e) => handleKeyDown(e, i)}
              onPaste={handlePaste}
              inputMode="numeric"
              maxLength={1}
              className={`h-14 w-11 rounded-xl border bg-white/[0.05] text-center text-xl font-semibold text-white outline-none transition-all focus:ring-2 focus:ring-[#7C3AED]/40 ${
                error ? 'border-[#EF4444]/60' : 'border-white/10 focus:border-[#7C3AED]/60'
              }`}
            />
          ))}
        </div>

        {error && <p className="mt-3 text-xs text-[#EF4444]">Enter all {PASSCODE_LENGTH} digits to continue.</p>}

        <Button size="lg" className="mt-7 w-full" onClick={handleSubmit}>
          <KeyRound size={17} /> Unlock console
        </Button>

        <p className="mt-5 text-xs text-[#CBD5E1]/50">
          Passcodes are rotated by the operations lead. Contact your team lead if yours has expired.
        </p>
      </motion.div>
    </div>
  )
}
