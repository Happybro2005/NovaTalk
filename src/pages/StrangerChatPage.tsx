import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Loader2, Radar, Send } from 'lucide-react'
import { collection, doc, getDoc, onSnapshot, query, serverTimestamp, updateDoc, where } from 'firebase/firestore'
import AppShell from '../components/AppShell'
import { Badge, Button, GlassCard, Input, Eyebrow } from '../components/ui'
import { useAuth } from '../contexts/AuthContext'
import { matchmakingService } from '../services/matchmakingService'
import { chatService } from '../services/chatService'
import { db } from '../firebase'

const departments = ['Computer Science', 'Information Technology', 'Electronics', 'Mechanical', 'Civil', 'Business']
const semesters = ['1', '2', '3', '4', '5', '6', '7', '8']
const subjects = ['DSA', 'DBMS', 'Operating Systems', 'Networks', 'Machine Learning', 'Calculus']
const interests = ['AI', 'Web Development', 'Mobile Apps', 'Design', 'Research', 'Open Source', 'Robotics', 'Data Science', 'Hackathons', 'Music', 'Sports', 'Reading']
const skills = ['Coding', 'Presentation', 'Research', 'Design', 'Mentoring', 'Debugging']

type MatchProfile = {
  department: string
  semester: string
  subjects: string[]
  interests: string[]
  skills: string[]
}

const emptyMatchProfile: MatchProfile = {
  department: '',
  semester: '',
  subjects: [],
  interests: [],
  skills: [],
}

export default function StrangerChatPage() {
  const { currentUser } = useAuth()
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState<{ id: string; text: string }[]>([])
  const [profile, setProfile] = useState<MatchProfile>(emptyMatchProfile)
  const [showProfilePrompt, setShowProfilePrompt] = useState(false)
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileError, setProfileError] = useState('')

  useEffect(() => {
    const userId = currentUser?.uid ?? ''
    if (!userId) return

    let active = true
    let intervalId: ReturnType<typeof window.setInterval> | null = null
    const matchStartedAt = Date.now()

    async function loadMatchProfile() {
      const userSnapshot = await getDoc(doc(db, 'users', userId))
      const userData = userSnapshot.data() as Partial<MatchProfile> | undefined
      const nextProfile: MatchProfile = {
        department: userData?.department && userData.department !== 'Undeclared' ? userData.department : '',
        semester: userData?.semester ?? '',
        subjects: userData?.subjects ?? [],
        interests: userData?.interests ?? [],
        skills: userData?.skills ?? [],
      }

      if (!active) return false
      setProfile(nextProfile)
      const complete = Boolean(
        nextProfile.department &&
        nextProfile.semester &&
        nextProfile.subjects.length > 0 &&
        nextProfile.interests.length > 0 &&
        nextProfile.skills.length > 0,
      )
      setShowProfilePrompt(!complete)
      setLoading(!complete)
      return complete
    }

    async function startMatchmaking() {
      const complete = await loadMatchProfile()
      if (!complete || !active) return

      setLoading(true)
      await updateDoc(doc(db, 'users', userId), {
        lastOpenedStudyMatchAt: serverTimestamp(),
      })
      await matchmakingService.joinStudyQueue(userId)

      intervalId = window.setInterval(async () => {
        const matchId = await matchmakingService.findMatch(userId)
        if (matchId && active) {
          setConversationId(matchId)
          setLoading(false)
          if (intervalId) {
            clearInterval(intervalId)
            intervalId = null
          }
        }
      }, 2500)

      const conversationQuery = query(
        collection(db, 'conversations'),
        where('type', '==', 'study'),
        where('participantIds', 'array-contains', userId)
      )

      return onSnapshot(conversationQuery, (snap) => {
        const matchedConversation = snap.docs.find((conversationDoc) => {
          const data = conversationDoc.data() as { createdAt?: { toMillis?: () => number } }
          return (data.createdAt?.toMillis?.() ?? 0) >= matchStartedAt
        })
        if (matchedConversation && active) {
          setConversationId(matchedConversation.id)
          setLoading(false)
          if (intervalId) {
            clearInterval(intervalId)
            intervalId = null
          }
        }
      })
    }

    let unsubscribeConversation: (() => void) | undefined
    startMatchmaking().then((unsubscribe) => {
      unsubscribeConversation = unsubscribe
    })

    return () => {
      active = false
      if (intervalId) {
        clearInterval(intervalId)
      }
      void matchmakingService.leaveStudyQueue(userId)
      unsubscribeConversation?.()
    }
  }, [currentUser?.uid])

  function toggleProfileValue(field: 'subjects' | 'interests' | 'skills', value: string) {
    setProfile((current) => ({
      ...current,
      [field]: current[field].includes(value)
        ? current[field].filter((item) => item !== value)
        : [...current[field], value],
    }))
  }

  async function saveMatchProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!currentUser) return
    if (!profile.department || !profile.semester || !profile.subjects.length || !profile.interests.length || !profile.skills.length) {
      setProfileError('Please select a department, semester, subject, interest, and skill.')
      return
    }

    setSavingProfile(true)
    setProfileError('')
    try {
      await updateDoc(doc(db, 'users', currentUser.uid), profile)
      setShowProfilePrompt(false)
      window.location.reload()
    } catch (error) {
      setProfileError(error instanceof Error ? error.message : 'Unable to save your matching profile.')
    } finally {
      setSavingProfile(false)
    }
  }

  async function sendMessage() {
    if (!currentUser || !conversationId || !message.trim()) return
    await chatService.sendMessage(conversationId, currentUser.uid, message.trim())
    setMessages((current) => [...current, { id: `${Date.now()}`, text: message.trim() }])
    setMessage('')
  }

  return (
    <AppShell>
      <Eyebrow>STUDY MATCH</Eyebrow>
      <div className="mt-2 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-white" style={{ fontFamily: 'var(--font-display)' }}>Find a study partner, live.</h1>
          <p className="mt-1 text-[#CBD5E1]">We are matching you with students who share your department, semester, and subjects.</p>
        </div>
        <Badge tone={loading ? 'warning' : 'success'}>{loading ? 'Finding partner' : 'Matched'}</Badge>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <GlassCard strong className="p-6">
          {loading ? (
            <div className="flex min-h-[420px] flex-col items-center justify-center text-center">
              <div className="relative flex h-28 w-28 items-center justify-center rounded-full border border-[#4F8CFF]/30 bg-[#4F8CFF]/10 text-[#4F8CFF]">
                <Radar size={42} className="animate-pulse" />
                <span className="absolute inset-0 animate-ping rounded-full border border-[#4F8CFF]/30" />
              </div>
              <h2 className="mt-6 text-xl font-semibold text-white">Finding a study partner...</h2>
              <p className="mt-2 max-w-md text-sm text-[#CBD5E1]">A live student collaboration chat will open as soon as the best available match is found.</p>
              <Button className="mt-6" variant="secondary" disabled>
                <Loader2 size={16} className="animate-spin" /> Waiting in queue
              </Button>
            </div>
          ) : (
            <div className="flex min-h-[420px] flex-col">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-white">Live chat</h2>
                  <p className="text-xs text-[#CBD5E1]">Conversation {conversationId}</p>
                </div>
                <Link className="text-sm text-[#4F8CFF] hover:underline" to="/dashboard">Back to dashboard</Link>
              </div>
              <div className="flex-1 space-y-3 rounded-2xl border border-white/10 bg-black/20 p-4">
                {messages.length === 0 ? (
                  <p className="text-sm text-[#CBD5E1]">No messages yet. Say hello.</p>
                ) : (
                  messages.map((msg) => (
                    <div key={msg.id} className="rounded-xl bg-white/[0.05] p-3 text-sm text-white">
                      {msg.text}
                    </div>
                  ))
                )}
              </div>
              <div className="mt-4 flex gap-3">
                <Input value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Write a message..." />
                <Button type="button" onClick={sendMessage}><Send size={16} /> Send</Button>
              </div>
            </div>
          )}
        </GlassCard>

        <GlassCard className="p-6">
          <h2 className="font-semibold text-white">How it works</h2>
          <div className="mt-4 space-y-4 text-sm text-[#CBD5E1]">
            <p>1. You join the study queue from your authenticated account.</p>
            <p>2. The service searches for another waiting student and creates a temporary study conversation.</p>
            <p>3. Once matched, this panel becomes the live chat surface.</p>
          </div>
        </GlassCard>
      </div>

      {showProfilePrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/75 p-4" role="dialog" aria-modal="true" aria-labelledby="match-profile-title">
          <GlassCard strong className="my-8 w-full max-w-2xl p-6">
            <h2 id="match-profile-title" className="text-xl font-semibold text-white">Complete your study profile</h2>
            <p className="mt-2 text-sm text-[#CBD5E1]">We need these details to find a relevant real student. Your profile will be saved before matchmaking starts.</p>
            {profileError && <p className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{profileError}</p>}
            <form className="mt-6 space-y-5" onSubmit={saveMatchProfile}>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-sm text-[#CBD5E1]">
                  Department
                  <select value={profile.department} onChange={(event) => setProfile((current) => ({ ...current, department: event.target.value }))} className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/[0.05] px-4 py-2.5 text-white">
                    <option value="" className="bg-[#0F172A]">Select department</option>
                    {departments.map((item) => <option key={item} className="bg-[#0F172A]">{item}</option>)}
                  </select>
                </label>
                <label className="text-sm text-[#CBD5E1]">
                  Semester
                  <select value={profile.semester} onChange={(event) => setProfile((current) => ({ ...current, semester: event.target.value }))} className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/[0.05] px-4 py-2.5 text-white">
                    <option value="" className="bg-[#0F172A]">Select semester</option>
                    {semesters.map((item) => <option key={item} className="bg-[#0F172A]">{item}</option>)}
                  </select>
                </label>
              </div>

              {([
                ['subjects', 'Subjects', subjects],
                ['interests', 'Interests', interests],
                ['skills', 'Skills', skills],
              ] as const).map(([field, label, options]) => (
                <fieldset key={field}>
                  <legend className="text-sm font-medium text-[#CBD5E1]">{label} <span className="text-xs text-[#CBD5E1]/60">(select at least one)</span></legend>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {options.map((item) => {
                      const selected = profile[field].includes(item)
                      return (
                        <button key={item} type="button" onClick={() => toggleProfileValue(field, item)} className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${selected ? 'border-[#4F8CFF]/60 bg-[#4F8CFF]/20 text-white' : 'border-white/10 bg-white/[0.04] text-[#CBD5E1] hover:bg-white/[0.08]'}`}>
                          {item}
                        </button>
                      )
                    })}
                  </div>
                </fieldset>
              ))}

              <Button type="submit" className="w-full" disabled={savingProfile}>
                {savingProfile ? 'Saving profile...' : 'Save profile and find partner'}
              </Button>
            </form>
          </GlassCard>
        </div>
      )}
    </AppShell>
  )
}
