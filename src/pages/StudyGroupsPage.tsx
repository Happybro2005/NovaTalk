import { useEffect, useState } from 'react'
import { BookOpen, PlusCircle } from 'lucide-react'
import AppShell from '../components/AppShell'
import { Badge, Button, GlassCard, Eyebrow, Input } from '../components/ui'
import { useAuth } from '../contexts/AuthContext'
import { studyGroupService } from '../services/studyGroupService'
import type { StudyGroup } from '../types/models'

const subjects = ['DSA', 'DBMS', 'Operating Systems', 'Networks', 'Machine Learning', 'Calculus']

export default function StudyGroupsPage() {
  const { currentUser } = useAuth()
  const [groups, setGroups] = useState<StudyGroup[]>([])
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [subject, setSubject] = useState(subjects[0])
  const [description, setDescription] = useState('')

  async function loadGroups() {
    setGroups(await studyGroupService.getStudyGroups())
  }

  useEffect(() => { loadGroups() }, [])

  async function handleCreate() {
    if (!currentUser || !name.trim()) return
    await studyGroupService.createStudyGroup({
      name: name.trim(),
      subject,
      description: description.trim(),
      createdBy: currentUser.uid,
    })
    setName('')
    setDescription('')
    setShowForm(false)
    await loadGroups()
  }

  return (
    <AppShell>
      <Eyebrow>STUDY GROUPS</Eyebrow>
      <div className="mt-2 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-white" style={{ fontFamily: 'var(--font-display)' }}>Subject-wise study groups</h1>
          <p className="mt-1 text-[#CBD5E1]">Join or create groups for collaborative learning and subject discussions.</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}><PlusCircle size={16} /> Create group</Button>
      </div>

      {showForm && (
        <GlassCard className="mt-6 p-5">
          <h2 className="font-semibold text-white">New study group</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Input label="Group name" value={name} onChange={(e) => setName(e.target.value)} placeholder="DBMS Study Circle" />
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[#CBD5E1]">Subject</label>
              <select value={subject} onChange={(e) => setSubject(e.target.value)} className="w-full rounded-xl border border-white/10 bg-white/[0.05] px-3.5 py-2.5 text-sm text-white outline-none">
                {subjects.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <Input label="Description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Weekly discussions and doubt solving" className="sm:col-span-2" />
          </div>
          <Button className="mt-4" onClick={handleCreate}>Create group</Button>
        </GlassCard>
      )}

      <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {groups.length === 0 ? (
          <GlassCard className="col-span-full p-8 text-center text-[#CBD5E1]">No study groups yet. Create the first one!</GlassCard>
        ) : groups.map((group) => (
          <GlassCard key={group.id} className="p-5">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#4F8CFF]/15 text-[#4F8CFF]">
                <BookOpen size={22} />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="truncate font-semibold text-white">{group.name}</h2>
                <p className="mt-1 text-sm text-[#CBD5E1]">{group.description}</p>
                <div className="mt-3 flex gap-2">
                  <Badge tone="neutral">{group.subject}</Badge>
                  <Badge tone="success">{group.memberCount} members</Badge>
                </div>
              </div>
            </div>
            <Button className="mt-5 w-full" variant="secondary" onClick={async () => { if (currentUser) { await studyGroupService.joinStudyGroup(currentUser.uid, group.id); await loadGroups() } }}>
              Join group
            </Button>
          </GlassCard>
        ))}
      </div>
    </AppShell>
  )
}
