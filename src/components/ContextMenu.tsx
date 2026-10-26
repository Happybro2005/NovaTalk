import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckSquare,
  Clipboard,
  Copy,
  ExternalLink,
  Home,
  LifeBuoy,
  Link as LinkIcon,
  Maximize2,
  MessageSquare,
  Moon,
  RotateCw,
  Scissors,
  Search,
  Settings,
  Share2,
  ShieldCheck,
  Sun,
  Trash2,
  Users,
  UsersRound,
} from 'lucide-react'
import { doc, setDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../contexts/AuthContext'
import { userService } from '../services/userService'
import { applyTheme } from '../utils/theme'

type ContextType = 'input' | 'selection' | 'link' | 'image' | 'message' | 'default'

interface MenuState {
  isOpen: boolean
  x: number
  y: number
  contextType: ContextType
  targetElement: HTMLElement | null
  selectionText: string
  linkHref: string
  linkText: string
  imgSrc: string
  messageText: string
}

const EMOJI_LIST = ['😀', '👍', '❤️', '🔥', '🚀', '💡', '🎉', '👏']

export default function ContextMenu() {
  const navigate = useNavigate()
  const location = useLocation()
  const { currentUser } = useAuth()
  const [isAdmin, setIsAdmin] = useState(false)
  const [copiedNotification, setCopiedNotification] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const [menu, setMenu] = useState<MenuState>({
    isOpen: false,
    x: 0,
    y: 0,
    contextType: 'default',
    targetElement: null,
    selectionText: '',
    linkHref: '',
    linkText: '',
    imgSrc: '',
    messageText: '',
  })

  // Check admin status for contextual admin tools
  useEffect(() => {
    if (!currentUser) {
      setIsAdmin(false)
      return
    }
    let active = true
    userService.getUserProfile(currentUser.uid).then((profile) => {
      if (!active) return
      const role = profile?.role?.toString().trim().toLowerCase()
      setIsAdmin(role === 'admin' || role === 'moderator')
    }).catch(() => {
      if (active) setIsAdmin(false)
    })
    return () => { active = false }
  }, [currentUser])

  // Global right-click handler replacing default browser menu everywhere
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault()

      const target = e.target as HTMLElement
      const selection = window.getSelection()?.toString().trim() || ''

      // 1. Text input / textarea detection
      const isInput =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target.isContentEditable ||
        Boolean(target.closest('input, textarea, [contenteditable="true"]'))

      const inputElement = isInput
        ? ((target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement)
            ? target
            : (target.closest('input, textarea') as HTMLInputElement | HTMLTextAreaElement | null))
        : null

      // 2. Link detection
      const linkEl = target.closest('a') as HTMLAnchorElement | null
      const linkHref = linkEl ? linkEl.href : ''
      const linkText = linkEl ? linkEl.textContent?.trim() || '' : ''

      // 3. Image detection
      const imgEl = target.closest('img') as HTMLImageElement | null
      const imgSrc = imgEl ? imgEl.src : ''

      // 4. Chat message / message bubble detection
      const messageEl = target.closest(
        '[data-message-text], .message-bubble, div[class*="rounded-xl p-3 text-sm"], div[class*="rounded-xl border border-white/10 bg-white/[0.04] p-4"]'
      ) as HTMLElement | null
      const messageText = messageEl
        ? messageEl.getAttribute('data-message-text') || messageEl.innerText || ''
        : ''

      // Determine context priority
      let contextType: ContextType = 'default'
      if (inputElement) {
        contextType = 'input'
      } else if (selection.length > 0) {
        contextType = 'selection'
      } else if (linkHref) {
        contextType = 'link'
      } else if (imgSrc) {
        contextType = 'image'
      } else if (messageText && messageText.length > 3) {
        contextType = 'message'
      }

      // Calculate position with viewport boundary clamping
      const menuWidth = 240
      const menuHeight = 360
      const posX = Math.max(10, Math.min(e.clientX, window.innerWidth - menuWidth - 12))
      const posY = Math.max(10, Math.min(e.clientY, window.innerHeight - menuHeight - 12))

      setMenu({
        isOpen: true,
        x: posX,
        y: posY,
        contextType,
        targetElement: inputElement || target,
        selectionText: selection,
        linkHref,
        linkText,
        imgSrc,
        messageText,
      })
    }

    const closeMenu = (e?: Event) => {
      if (e && menuRef.current && e.target && menuRef.current.contains(e.target as Node)) {
        return
      }
      setMenu((prev) => (prev.isOpen ? { ...prev, isOpen: false } : prev))
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeMenu()
    }

    window.addEventListener('contextmenu', handleContextMenu, { capture: true })
    window.addEventListener('pointerdown', closeMenu)
    window.addEventListener('scroll', closeMenu, { capture: true })
    window.addEventListener('resize', closeMenu)
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('contextmenu', handleContextMenu, { capture: true })
      window.removeEventListener('pointerdown', closeMenu)
      window.removeEventListener('scroll', closeMenu, { capture: true })
      window.removeEventListener('resize', closeMenu)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  function showToast(text: string) {
    setCopiedNotification(text)
    setTimeout(() => setCopiedNotification(null), 2200)
  }

  function handleClose() {
    setMenu((prev) => ({ ...prev, isOpen: false }))
  }

  // Input editing helpers
  async function handleInputPaste() {
    handleClose()
    if (!menu.targetElement) return
    const input = menu.targetElement as HTMLInputElement | HTMLTextAreaElement
    try {
      const text = await navigator.clipboard.readText()
      if (typeof input.selectionStart === 'number' && typeof input.selectionEnd === 'number') {
        const start = input.selectionStart
        const end = input.selectionEnd
        const val = input.value || ''
        input.value = val.substring(0, start) + text + val.substring(end)
        input.setSelectionRange(start + text.length, start + text.length)
      } else {
        input.value = (input.value || '') + text
      }
      input.dispatchEvent(new Event('input', { bubbles: true }))
      input.focus()
      showToast('Pasted from clipboard')
    } catch {
      showToast('Clipboard access unavailable')
    }
  }

  function handleInputCut() {
    handleClose()
    if (!menu.targetElement) return
    const input = menu.targetElement as HTMLInputElement | HTMLTextAreaElement
    const start = input.selectionStart ?? 0
    const end = input.selectionEnd ?? 0
    const val = input.value || ''
    const selected = val.substring(start, end)
    if (selected) {
      void navigator.clipboard.writeText(selected)
      input.value = val.substring(0, start) + val.substring(end)
      input.setSelectionRange(start, start)
      input.dispatchEvent(new Event('input', { bubbles: true }))
      showToast('Cut to clipboard')
    }
    input.focus()
  }

  function handleInputCopy() {
    handleClose()
    if (!menu.targetElement) return
    const input = menu.targetElement as HTMLInputElement | HTMLTextAreaElement
    const start = input.selectionStart ?? 0
    const end = input.selectionEnd ?? 0
    const val = input.value || ''
    const selected = val.substring(start, end) || val
    if (selected) {
      void navigator.clipboard.writeText(selected)
      showToast('Copied to clipboard')
    }
  }

  function handleInputSelectAll() {
    handleClose()
    if (!menu.targetElement) return
    const input = menu.targetElement as HTMLInputElement | HTMLTextAreaElement
    input.focus()
    input.select()
  }

  function handleInputClear() {
    handleClose()
    if (!menu.targetElement) return
    const input = menu.targetElement as HTMLInputElement | HTMLTextAreaElement
    input.value = ''
    input.dispatchEvent(new Event('input', { bubbles: true }))
    input.focus()
    showToast('Field cleared')
  }

  function handleInsertEmoji(emoji: string) {
    handleClose()
    if (!menu.targetElement) return
    const input = menu.targetElement as HTMLInputElement | HTMLTextAreaElement
    const start = input.selectionStart ?? input.value?.length ?? 0
    const val = input.value || ''
    input.value = val.substring(0, start) + emoji + val.substring(start)
    input.setSelectionRange(start + emoji.length, start + emoji.length)
    input.dispatchEvent(new Event('input', { bubbles: true }))
    input.focus()
  }

  // Selection actions
  function handleCopySelection() {
    handleClose()
    if (menu.selectionText) {
      void navigator.clipboard.writeText(menu.selectionText)
      showToast('Selection copied')
    }
  }

  function handleSearchWeb() {
    handleClose()
    if (menu.selectionText) {
      window.open(
        `https://www.google.com/search?q=${encodeURIComponent(menu.selectionText)}`,
        '_blank',
        'noopener,noreferrer'
      )
    }
  }

  function handleCopyQuote() {
    handleClose()
    if (menu.selectionText) {
      void navigator.clipboard.writeText(`> "${menu.selectionText}"`)
      showToast('Copied as quote')
    }
  }

  // Link actions
  function handleOpenLink(inNewTab = false) {
    handleClose()
    if (!menu.linkHref) return
    if (inNewTab) {
      window.open(menu.linkHref, '_blank', 'noopener,noreferrer')
    } else {
      try {
        const url = new URL(menu.linkHref)
        if (url.origin === window.location.origin) {
          navigate(url.pathname + url.search)
          return
        }
      } catch {
        // fallback
      }
      window.location.href = menu.linkHref
    }
  }

  function handleCopyLink() {
    handleClose()
    if (menu.linkHref) {
      void navigator.clipboard.writeText(menu.linkHref)
      showToast('Link copied to clipboard')
    }
  }

  // Image actions
  function handleOpenImage() {
    handleClose()
    if (menu.imgSrc) {
      window.open(menu.imgSrc, '_blank', 'noopener,noreferrer')
    }
  }

  function handleCopyImageAddress() {
    handleClose()
    if (menu.imgSrc) {
      void navigator.clipboard.writeText(menu.imgSrc)
      showToast('Image address copied')
    }
  }

  // Message actions
  function handleCopyMessage() {
    handleClose()
    if (menu.messageText) {
      void navigator.clipboard.writeText(menu.messageText)
      showToast('Message text copied')
    }
  }

  // Default page actions
  function handleCopyPageUrl() {
    handleClose()
    void navigator.clipboard.writeText(window.location.href)
    showToast('Page link copied')
  }

  async function handleToggleTheme() {
    handleClose()
    const isCurrentlyLight = document.documentElement.dataset.theme === 'light'
    const nextTheme = isCurrentlyLight ? 'dark' : 'light'
    applyTheme(nextTheme)
    if (currentUser) {
      try {
        await setDoc(doc(db, 'users', currentUser.uid, 'settings', 'default'), { theme: nextTheme }, { merge: true })
      } catch (err) {
        console.warn('Unable to persist theme to Firestore', err)
      }
    }
    showToast(`Switched to ${nextTheme} theme`)
  }

  if (!menu.isOpen) {
    return (
      <>
        {copiedNotification && (
          <div className="fixed bottom-6 right-6 z-[9999999] flex items-center gap-2 rounded-xl border border-white/20 bg-[#0B0F19]/95 px-4 py-2.5 text-xs font-medium text-white shadow-2xl backdrop-blur-md animate-fade-in">
            <Check size={14} className="text-emerald-400" />
            <span>{copiedNotification}</span>
          </div>
        )}
      </>
    )
  }

  return (
    <>
      {copiedNotification && (
        <div className="fixed bottom-6 right-6 z-[9999999] flex items-center gap-2 rounded-xl border border-white/20 bg-[#0B0F19]/95 px-4 py-2.5 text-xs font-medium text-white shadow-2xl backdrop-blur-md animate-fade-in">
          <Check size={14} className="text-emerald-400" />
          <span>{copiedNotification}</span>
        </div>
      )}

      <div
        ref={menuRef}
        style={{ left: `${menu.x}px`, top: `${menu.y}px` }}
        className="context-menu-box fixed z-[999999] w-[235px] max-h-[88vh] overflow-y-auto rounded-2xl border border-white/15 bg-[#0B0F19]/95 p-1.5 text-xs text-[#CBD5E1] shadow-2xl backdrop-blur-2xl ring-1 ring-black/50 select-none animate-in fade-in zoom-in-95 duration-100"
      >
        {/* Context: Text Input Field */}
        {menu.contextType === 'input' && (
          <div>
            <div className="px-2.5 py-1 text-[10px] font-semibold text-[#94A3B8] uppercase tracking-wider">
              Text Editing
            </div>
            <MenuItem onClick={handleInputCut} icon={Scissors} label="Cut" shortcut="Ctrl+X" />
            <MenuItem onClick={handleInputCopy} icon={Copy} label="Copy" shortcut="Ctrl+C" />
            <MenuItem onClick={() => void handleInputPaste()} icon={Clipboard} label="Paste" shortcut="Ctrl+V" />
            <MenuItem onClick={handleInputSelectAll} icon={CheckSquare} label="Select All" shortcut="Ctrl+A" />
            <MenuItem onClick={handleInputClear} icon={Trash2} label="Clear Field" />

            <div className="my-1.5 border-t border-white/10" />
            <div className="px-2.5 py-1 text-[10px] font-semibold text-[#94A3B8] uppercase tracking-wider">
              Quick Emojis
            </div>
            <div className="flex flex-wrap items-center justify-between gap-1 px-1.5 py-1">
              {EMOJI_LIST.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => handleInsertEmoji(emoji)}
                  className="flex h-6 w-6 items-center justify-center rounded-lg hover:bg-white/10 transition-colors text-sm"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Context: Selected Text on Page */}
        {menu.contextType === 'selection' && (
          <div>
            <div className="px-2.5 py-1 text-[10px] font-semibold text-[#94A3B8] uppercase tracking-wider">
              Selected Text
            </div>
            <MenuItem onClick={handleCopySelection} icon={Copy} label="Copy Selection" shortcut="Ctrl+C" />
            <MenuItem onClick={handleSearchWeb} icon={Search} label={`Search web for "${menu.selectionText.slice(0, 14)}..."`} />
            <MenuItem onClick={handleCopyQuote} icon={MessageSquare} label="Copy as Markdown Quote" />
          </div>
        )}

        {/* Context: Clicked on a Link */}
        {menu.contextType === 'link' && (
          <div>
            <div className="px-2.5 py-1 text-[10px] font-semibold text-[#94A3B8] uppercase tracking-wider truncate">
              Link: {menu.linkText || 'Target'}
            </div>
            <MenuItem onClick={() => handleOpenLink(false)} icon={ExternalLink} label="Open Link" />
            <MenuItem onClick={() => handleOpenLink(true)} icon={ExternalLink} label="Open in New Tab" />
            <MenuItem onClick={handleCopyLink} icon={LinkIcon} label="Copy Link Address" />
          </div>
        )}

        {/* Context: Clicked on an Image */}
        {menu.contextType === 'image' && (
          <div>
            <div className="px-2.5 py-1 text-[10px] font-semibold text-[#94A3B8] uppercase tracking-wider">
              Image Options
            </div>
            <MenuItem onClick={handleOpenImage} icon={Maximize2} label="Open Image in New Window" />
            <MenuItem onClick={handleCopyImageAddress} icon={Copy} label="Copy Image Address" />
          </div>
        )}

        {/* Context: Chat Message / Discussion Bubble */}
        {menu.contextType === 'message' && (
          <div>
            <div className="px-2.5 py-1 text-[10px] font-semibold text-[#94A3B8] uppercase tracking-wider">
              Message Actions
            </div>
            <MenuItem onClick={handleCopyMessage} icon={Copy} label="Copy Message Text" />
            <div className="my-1.5 border-t border-white/10" />
            <div className="px-2.5 py-1 text-[10px] font-semibold text-[#94A3B8] uppercase tracking-wider">
              Quick Reaction
            </div>
            <div className="flex items-center justify-between gap-1 px-1.5 py-1">
              {['👍', '❤️', '😂', '🚀', '🔥', '👏'].map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => {
                    handleClose()
                    void navigator.clipboard.writeText(emoji)
                    showToast(`Reaction ${emoji} copied`)
                  }}
                  className="flex h-6 w-6 items-center justify-center rounded-lg hover:bg-white/10 transition-colors text-sm"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Universal Page / Navigation Section */}
        <div className="my-1.5 border-t border-white/10" />
        <div className="px-2.5 py-1 text-[10px] font-semibold text-[#94A3B8] uppercase tracking-wider">
          Orbit Navigation
        </div>

        <div className="grid grid-cols-3 gap-1 px-1 mb-1">
          <button
            type="button"
            title="Go Back"
            onClick={() => {
              handleClose()
              window.history.back()
            }}
            className="flex items-center justify-center py-1 rounded-lg bg-white/[0.04] hover:bg-white/10 text-white transition-colors"
          >
            <ArrowLeft size={13} />
          </button>
          <button
            type="button"
            title="Go Forward"
            onClick={() => {
              handleClose()
              window.history.forward()
            }}
            className="flex items-center justify-center py-1 rounded-lg bg-white/[0.04] hover:bg-white/10 text-white transition-colors"
          >
            <ArrowRight size={13} />
          </button>
          <button
            type="button"
            title="Reload Page"
            onClick={() => {
              handleClose()
              window.location.reload()
            }}
            className="flex items-center justify-center py-1 rounded-lg bg-white/[0.04] hover:bg-white/10 text-white transition-colors"
          >
            <RotateCw size={13} />
          </button>
        </div>

        {location.pathname !== '/dashboard' && (
          <MenuItem
            onClick={() => {
              handleClose()
              navigate('/dashboard')
            }}
            icon={Home}
            label="Dashboard"
          />
        )}

        <MenuItem
          onClick={() => {
            handleClose()
            navigate('/friends')
          }}
          icon={Users}
          label="Friends Hub"
        />

        <MenuItem
          onClick={() => {
            handleClose()
            navigate('/groups')
          }}
          icon={UsersRound}
          label="Groups"
        />

        <MenuItem
          onClick={() => {
            handleClose()
            navigate('/support')
          }}
          icon={LifeBuoy}
          label="Support & Help"
        />

        <div className="my-1.5 border-t border-white/10" />

        <MenuItem onClick={handleCopyPageUrl} icon={Share2} label="Copy Page Link" />
        <MenuItem
          onClick={() => void handleToggleTheme()}
          icon={document.documentElement.dataset.theme === 'light' ? Moon : Sun}
          label={`Switch to ${document.documentElement.dataset.theme === 'light' ? 'Dark' : 'Light'} Mode`}
        />
        <MenuItem
          onClick={() => {
            handleClose()
            navigate('/settings')
          }}
          icon={Settings}
          label="Settings"
        />

        {isAdmin && (
          <>
            <div className="my-1.5 border-t border-white/10" />
            <MenuItem
              onClick={() => {
                handleClose()
                navigate('/admin/dashboard')
              }}
              icon={ShieldCheck}
              label="Admin Mission Control"
              highlight
            />
          </>
        )}
      </div>
    </>
  )
}

function MenuItem({
  onClick,
  icon: Icon,
  label,
  shortcut,
  highlight = false,
}: {
  onClick: () => void
  icon: React.ComponentType<{ size: number; className?: string }>
  label: string
  shortcut?: string
  highlight?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-2.5 rounded-xl px-2.5 py-1.5 text-left text-xs transition-colors ${
        highlight
          ? 'text-[#93C5FD] hover:bg-[#4F8CFF]/20 hover:text-white font-medium'
          : 'text-[#CBD5E1] hover:bg-white/[0.08] hover:text-white'
      }`}
    >
      <Icon size={14} className={highlight ? 'text-[#4F8CFF]' : 'text-[#94A3B8]'} />
      <span className="truncate flex-1">{label}</span>
      {shortcut && <span className="text-[10px] font-mono text-[#64748B] ml-auto">{shortcut}</span>}
    </button>
  )
}
