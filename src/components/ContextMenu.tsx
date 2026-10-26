import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckSquare,
  Clipboard,
  Copy,
  ExternalLink,
  Flag,
  Home,
  LifeBuoy,
  Link as LinkIcon,
  Loader2,
  Maximize2,
  MessageSquare,
  Moon,
  RotateCw,
  Scissors,
  Search,
  Settings,
  Share2,
  ShieldAlert,
  ShieldCheck,
  Sun,
  Trash2,
  Users,
  UsersRound,
  X,
} from 'lucide-react'
import { doc, setDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../contexts/AuthContext'
import { userService } from '../services/userService'
import { reportService } from '../services/reportService'
import { applyTheme } from '../utils/theme'

type ContextType = 'input' | 'selection' | 'link' | 'image' | 'message' | 'chat' | 'default'

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
  messageId: string
  messageSenderId: string
  messageSenderName: string
  isSelfMessage: boolean
  chatId: string
  chatName: string
  isSelfChat: boolean
  isChatRoute: boolean
}

interface ReportModalData {
  isOpen: boolean
  type: 'message' | 'chat'
  targetId: string
  reportedUserId?: string
  reportedUserName?: string
  text?: string
  senderName?: string
  chatName?: string
}

const EMOJI_LIST = ['😀', '👍', '❤️', '🔥', '🚀', '💡', '🎉', '👏']

const REPORT_REASONS = [
  { id: 'harassment', label: 'Harassment or Bullying', desc: 'Disrespectful, threatening, or targeted behavior' },
  { id: 'spam', label: 'Spam, Scam, or Phishing', desc: 'Fraudulent links, promotions, or impersonation' },
  { id: 'hate', label: 'Hate Speech or Discrimination', desc: 'Attacking protected groups or hate symbols' },
  { id: 'inappropriate', label: 'Inappropriate Content', desc: 'Explicit, NSFW, or unsafe media/text' },
  { id: 'danger', label: 'Violence or Physical Harm', desc: 'Self-harm or threats of real-world harm' },
  { id: 'other', label: 'Other Policy Violation', desc: 'Any other violation of NovaTalk rules' },
]

export default function ContextMenu() {
  const navigate = useNavigate()
  const location = useLocation()
  const { currentUser } = useAuth()
  const [isAdmin, setIsAdmin] = useState(false)
  const [copiedNotification, setCopiedNotification] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  // Report Modal state
  const [reportModal, setReportModal] = useState<ReportModalData | null>(null)
  const [selectedReason, setSelectedReason] = useState<string>('')
  const [reportDetails, setReportDetails] = useState<string>('')
  const [isSubmittingReport, setIsSubmittingReport] = useState<boolean>(false)
  const [reportError, setReportError] = useState<string>('')

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
    messageId: '',
    messageSenderId: '',
    messageSenderName: '',
    isSelfMessage: false,
    chatId: '',
    chatName: '',
    isSelfChat: false,
    isChatRoute: false,
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

  // Custom event listener so other components can programmatically trigger the report dialog
  useEffect(() => {
    const handleOpenReportEvent = (e: Event) => {
      const customEvent = e as CustomEvent<{
        type?: 'message' | 'chat'
        targetId?: string
        reportedUserId?: string
        reportedUserName?: string
        senderId?: string
        senderName?: string
        text?: string
        chatName?: string
        isSelf?: boolean
      }>
      if (customEvent.detail) {
        if (customEvent.detail.isSelf) {
          showToast('You cannot report your own message or self-chat.')
          return
        }

        setReportModal({
          isOpen: true,
          type: customEvent.detail.type || 'message',
          targetId: customEvent.detail.targetId || 'unknown',
          reportedUserId: customEvent.detail.reportedUserId || customEvent.detail.senderId,
          reportedUserName: customEvent.detail.reportedUserName || customEvent.detail.senderName,
          text: customEvent.detail.text,
          senderName: customEvent.detail.senderName,
          chatName: customEvent.detail.chatName,
        })
        setSelectedReason('')
        setReportDetails('')
        setReportError('')
      }
    }

    window.addEventListener('novatalk:open-report', handleOpenReportEvent)
    return () => window.removeEventListener('novatalk:open-report', handleOpenReportEvent)
  }, [])

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
        '[data-message-bubble], [data-message-id], [data-message-text], .message-bubble, div[class*="rounded-xl p-3 text-sm"], div[class*="rounded-xl border border-white/10 bg-white/[0.04] p-4"]'
      ) as HTMLElement | null

      const messageId = messageEl?.getAttribute('data-message-id') || ''
      const messageText = messageEl
        ? messageEl.getAttribute('data-message-text') || messageEl.innerText || ''
        : ''
      const messageSenderId = messageEl?.getAttribute('data-message-sender-id') || ''
      const messageSenderName = messageEl?.getAttribute('data-message-sender-name') || ''
      const isSelfMsgAttr = messageEl?.getAttribute('data-is-self') === 'true'
      const isSelfMessage = Boolean(
        isSelfMsgAttr ||
        (currentUser && messageSenderId && messageSenderId === currentUser.uid)
      )

      // 5. Chat card / container / route detection
      const chatEl = target.closest('[data-chat-card], [data-chat-container], [data-chat-id]') as HTMLElement | null
      const currentPath = window.location.pathname
      const isChatRoute = Boolean(
        currentPath.startsWith('/messages/') ||
        currentPath.startsWith('/groups/') ||
        currentPath === '/stranger-chat' ||
        currentPath === '/study-match'
      )

      const chatRouteId = currentPath.startsWith('/messages/')
        ? currentPath.replace('/messages/', '')
        : currentPath.startsWith('/groups/')
        ? currentPath.split('/')[2]
        : ''

      const chatId = chatEl?.getAttribute('data-chat-id') || chatRouteId || ''
      const chatName = chatEl?.getAttribute('data-chat-name') || ''
      const isSelfChatAttr =
        chatEl?.getAttribute('data-is-self-chat') === 'true' ||
        target.closest('[data-is-self-chat="true"]') !== null
      const isSelfChat = Boolean(
        isSelfChatAttr ||
        (currentUser && chatId && chatId === currentUser.uid)
      )

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
      } else if (messageText && messageText.length > 0) {
        contextType = 'message'
      } else if (chatId || isChatRoute) {
        contextType = 'chat'
      }

      // Calculate position with viewport boundary clamping
      const menuWidth = 240
      const menuHeight = 390
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
        messageId,
        messageSenderId,
        messageSenderName,
        isSelfMessage,
        chatId,
        chatName,
        isSelfChat,
        isChatRoute,
      })
    }

    const closeMenu = (e?: Event) => {
      if (e && menuRef.current && e.target && menuRef.current.contains(e.target as Node)) {
        return
      }
      setMenu((prev) => (prev.isOpen ? { ...prev, isOpen: false } : prev))
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeMenu()
        if (reportModal?.isOpen) {
          setReportModal(null)
        }
      }
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
  }, [currentUser, reportModal?.isOpen])

  function showToast(text: string) {
    setCopiedNotification(text)
    setTimeout(() => setCopiedNotification(null), 2500)
  }

  function handleClose() {
    setMenu((prev) => ({ ...prev, isOpen: false }))
  }

  // Open the report modal with populated context
  function handleOpenReport(type: 'message' | 'chat') {
    handleClose()
    if (!currentUser) {
      showToast('Please sign in to submit a report.')
      return
    }

    if (type === 'message') {
      if (menu.isSelfMessage) {
        showToast('You cannot report your own message.')
        return
      }

      setReportModal({
        isOpen: true,
        type: 'message',
        targetId: menu.messageId || 'message',
        reportedUserId: menu.messageSenderId,
        reportedUserName: menu.messageSenderName,
        text: menu.messageText,
        senderName: menu.messageSenderName,
        chatName: menu.chatName,
      })
    } else {
      if (menu.isSelfChat) {
        showToast('Self chat cannot be reported.')
        return
      }

      setReportModal({
        isOpen: true,
        type: 'chat',
        targetId: menu.chatId || 'chat',
        reportedUserId: menu.chatId,
        reportedUserName: menu.chatName,
        chatName: menu.chatName,
      })
    }
    setSelectedReason('')
    setReportDetails('')
    setReportError('')
  }

  async function handleSubmitReport(e: React.FormEvent) {
    e.preventDefault()
    if (!currentUser) {
      setReportError('You must be signed in to submit a report.')
      return
    }
    if (!selectedReason) {
      setReportError('Please select a reason for reporting.')
      return
    }

    try {
      setIsSubmittingReport(true)
      setReportError('')

      const reasonLabel = REPORT_REASONS.find((r) => r.id === selectedReason)?.label || selectedReason

      await reportService.submitReport({
        reporterId: currentUser.uid,
        reporterName: currentUser.displayName || currentUser.email || 'User',
        targetType: reportModal?.type === 'message' ? 'message' : 'user',
        targetId: reportModal?.targetId || 'unknown',
        reportedUserId: reportModal?.reportedUserId,
        reportedUserName: reportModal?.reportedUserName || reportModal?.senderName || reportModal?.chatName,
        reason: reasonLabel,
        details: reportDetails,
        contentPreview: reportModal?.text,
      })

      setReportModal(null)
      showToast('Report submitted. Our moderation team will review it.')
    } catch (err) {
      setReportError(err instanceof Error ? err.message : 'Unable to submit report. Please try again.')
    } finally {
      setIsSubmittingReport(false)
    }
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

  return (
    <>
      {/* Toast Notification */}
      {copiedNotification && (
        <div className="fixed bottom-6 right-6 z-[9999999] flex items-center gap-2 rounded-xl border border-white/20 bg-[#0B0F19]/95 px-4 py-2.5 text-xs font-medium text-white shadow-2xl backdrop-blur-md animate-fade-in">
          <Check size={14} className="text-emerald-400" />
          <span>{copiedNotification}</span>
        </div>
      )}

      {/* Reporting Modal */}
      {reportModal?.isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="report-dialog-title"
          className="fixed inset-0 z-[99999999] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-in fade-in duration-150"
        >
          <div className="relative w-full max-w-md rounded-2xl border border-white/15 bg-[#0F1420] p-6 text-white shadow-2xl ring-1 ring-white/10 animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-red-500/30 bg-red-500/15 text-red-400 shadow-inner">
                  <Flag size={20} />
                </div>
                <div>
                  <h2 id="report-dialog-title" className="text-lg font-semibold text-white">
                    {reportModal.type === 'message' ? 'Report Message' : 'Report Chat'}
                  </h2>
                  <p className="text-xs text-[#94A3B8]">
                    Help keep NovaTalk safe. Reports are sent directly to moderators.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setReportModal(null)}
                className="rounded-lg p-1.5 text-[#94A3B8] hover:bg-white/10 hover:text-white transition-colors"
                aria-label="Close dialog"
              >
                <X size={18} />
              </button>
            </div>

            {/* Target Preview */}
            {reportModal.type === 'message' && reportModal.text && (
              <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.04] p-3 text-xs">
                <div className="mb-1 font-semibold text-[#93C5FD]">
                  {reportModal.senderName ? `Message by ${reportModal.senderName}:` : 'Reported message:'}
                </div>
                <p className="line-clamp-3 text-[#CBD5E1] italic">
                  "{reportModal.text}"
                </p>
              </div>
            )}

            {reportModal.type === 'chat' && reportModal.chatName && (
              <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.04] p-3 text-xs">
                <div className="mb-1 font-semibold text-[#93C5FD]">Target Conversation:</div>
                <p className="text-[#CBD5E1] font-medium">{reportModal.chatName}</p>
              </div>
            )}

            {/* Form */}
            <form onSubmit={(e) => void handleSubmitReport(e)} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#CBD5E1] mb-2 uppercase tracking-wider">
                  Select a reason <span className="text-red-400">*</span>
                </label>
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {REPORT_REASONS.map((reason) => {
                    const isSelected = selectedReason === reason.id
                    return (
                      <button
                        key={reason.id}
                        type="button"
                        onClick={() => setSelectedReason(reason.id)}
                        className={`w-full flex items-start gap-2.5 rounded-xl border p-2.5 text-left text-xs transition-all ${
                          isSelected
                            ? 'border-red-500/50 bg-red-500/15 text-white ring-1 ring-red-500/40'
                            : 'border-white/10 bg-white/[0.03] text-[#CBD5E1] hover:border-white/20 hover:bg-white/[0.06]'
                        }`}
                      >
                        <div
                          className={`mt-0.5 flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border ${
                            isSelected ? 'border-red-400 bg-red-400' : 'border-white/30'
                          }`}
                        >
                          {isSelected && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-white">{reason.label}</p>
                          <p className="text-[11px] text-[#94A3B8]">{reason.desc}</p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div>
                <label htmlFor="report-details" className="block text-xs font-semibold text-[#CBD5E1] mb-1.5">
                  Additional details <span className="text-[#64748B] font-normal">(optional)</span>
                </label>
                <textarea
                  id="report-details"
                  value={reportDetails}
                  onChange={(e) => setReportDetails(e.target.value)}
                  placeholder="Provide context or explanation for moderators..."
                  rows={3}
                  className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.05] p-2.5 text-xs text-white placeholder:text-[#64748B] outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/30"
                />
              </div>

              {reportError && (
                <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-2.5 text-xs text-red-300">
                  <AlertTriangle size={14} className="shrink-0" />
                  <span>{reportError}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setReportModal(null)}
                  disabled={isSubmittingReport}
                  className="rounded-xl px-4 py-2 text-xs font-medium text-[#CBD5E1] hover:bg-white/10 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReport || !selectedReason}
                  className="flex items-center gap-2 rounded-xl bg-red-500 hover:bg-red-600 px-4 py-2 text-xs font-medium text-white shadow-lg shadow-red-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmittingReport ? (
                    <>
                      <Loader2 size={13} className="animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Flag size={13} />
                      Submit Report
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dedicated Right-Click Menu */}
      {menu.isOpen && (
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

              {/* Self messages cannot be reported */}
              {!menu.isSelfMessage && (
                <MenuItem
                  onClick={() => handleOpenReport('message')}
                  icon={Flag}
                  label="Report Message"
                  highlightDanger
                />
              )}

              {/* Self chats cannot be reported */}
              {!menu.isSelfChat && (menu.chatId || menu.isChatRoute) && (
                <MenuItem
                  onClick={() => handleOpenReport('chat')}
                  icon={ShieldAlert}
                  label="Report This Chat"
                  highlightDanger
                />
              )}

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

          {/* Context: Inside a Chat / Clicked on Chat Card (Hidden if self chat) */}
          {menu.contextType === 'chat' && !menu.isSelfChat && (
            <div>
              <div className="px-2.5 py-1 text-[10px] font-semibold text-[#94A3B8] uppercase tracking-wider">
                Chat Actions
              </div>
              <MenuItem
                onClick={() => handleOpenReport('chat')}
                icon={Flag}
                label={menu.chatName ? `Report "${menu.chatName.slice(0, 16)}..."` : 'Report This Chat'}
                highlightDanger
              />
            </div>
          )}

          {/* If on a chat route but clicked default page area, still provide Report This Chat (Hidden if self chat) */}
          {menu.contextType === 'default' && menu.isChatRoute && !menu.isSelfChat && (
            <div>
              <div className="px-2.5 py-1 text-[10px] font-semibold text-[#94A3B8] uppercase tracking-wider">
                Chat Actions
              </div>
              <MenuItem
                onClick={() => handleOpenReport('chat')}
                icon={Flag}
                label={menu.chatName ? `Report "${menu.chatName.slice(0, 16)}..."` : 'Report This Chat'}
                highlightDanger
              />
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
      )}
    </>
  )
}

function MenuItem({
  onClick,
  icon: Icon,
  label,
  shortcut,
  highlight = false,
  highlightDanger = false,
}: {
  onClick: () => void
  icon: React.ComponentType<{ size: number; className?: string }>
  label: string
  shortcut?: string
  highlight?: boolean
  highlightDanger?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-2.5 rounded-xl px-2.5 py-1.5 text-left text-xs transition-colors ${
        highlightDanger
          ? 'text-red-400 hover:bg-red-500/15 hover:text-red-300 font-medium'
          : highlight
          ? 'text-[#93C5FD] hover:bg-[#4F8CFF]/20 hover:text-white font-medium'
          : 'text-[#CBD5E1] hover:bg-white/[0.08] hover:text-white'
      }`}
    >
      <Icon
        size={14}
        className={
          highlightDanger
            ? 'text-red-400'
            : highlight
            ? 'text-[#4F8CFF]'
            : 'text-[#94A3B8]'
        }
      />
      <span className="truncate flex-1">{label}</span>
      {shortcut && <span className="text-[10px] font-mono text-[#64748B] ml-auto">{shortcut}</span>}
    </button>
  )
}
