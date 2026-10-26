/**
 * Self-XSS console security warning.
 * Alerts users who open developer tools or attempt to paste malicious scripts.
 */
let lastPrintedAt = 0

export function initSecurityWarning() {
  if (typeof window === 'undefined') return

  const printWarning = () => {
    const now = Date.now()
    if (now - lastPrintedAt < 15_000) return
    lastPrintedAt = now

    console.log(
      '%c🛑 STOP!',
      'color: #EF4444; font-size: 54px; font-weight: 900; -webkit-text-stroke: 1.5px black; text-shadow: 3px 3px 0px rgba(0,0,0,0.8); line-height: 1.1; font-family: system-ui, -apple-system, sans-serif;'
    )
    console.log(
      '%cDO NOT TOUCH — ONLY FOR NOVATALK DEVELOPERS',
      'color: #F59E0B; font-size: 24px; font-weight: 800; text-shadow: 1px 1px 0px black; line-height: 1.3; font-family: system-ui, -apple-system, sans-serif;'
    )
    console.log(
      '%c⚠️ If someone told you to copy-paste something here to enable an Instagram feature or "hack" someone\'s account, it is a scam and will give them access to your NovaTalk account.',
      'color: #FFFFFF; background-color: #DC2626; font-size: 15px; font-weight: 800; padding: 10px 14px; border-radius: 8px; line-height: 1.5; border: 2px solid #991B1B; font-family: system-ui, -apple-system, sans-serif;'
    )
    console.log(
      '%cThis is a browser console intended strictly for NovaTalk engineers and developers. Executing code here can compromise your account credentials, messages, and personal data.',
      'color: #94A3B8; font-size: 13px; font-weight: 600; font-style: italic; line-height: 1.6; padding-top: 4px; font-family: system-ui, -apple-system, sans-serif;'
    )
  }

  // Print once on initial boot
  printWarning()

  // Re-print when developer shortcuts (F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C) are pressed (debounced)
  window.addEventListener('keydown', (e) => {
    if (
      e.key === 'F12' ||
      (e.ctrlKey &&
        e.shiftKey &&
        (e.key === 'I' || e.key === 'i' || e.key === 'J' || e.key === 'j' || e.key === 'C' || e.key === 'c'))
    ) {
      setTimeout(printWarning, 250)
    }
  })
}

