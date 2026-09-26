import { useEffect, useRef, useState } from 'react'
import { Download, FileText, Upload } from 'lucide-react'
import AppShell from '../components/AppShell'
import { Badge, Button, GlassCard, Eyebrow, Input } from '../components/ui'
import { useAuth } from '../contexts/AuthContext'
import { notesService } from '../services/notesService'
import type { StudyNote } from '../types/models'

const subjects = ['DSA', 'DBMS', 'Operating Systems', 'Networks', 'Machine Learning', 'Calculus']

export default function NotesPage() {
  const { currentUser } = useAuth()
  const [notes, setNotes] = useState<StudyNote[]>([])
  const [title, setTitle] = useState('')
  const [subject, setSubject] = useState(subjects[0])
  const [description, setDescription] = useState('')
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  async function loadNotes() {
    setNotes(await notesService.getNotes())
  }

  useEffect(() => { loadNotes() }, [])

  async function handleUpload() {
    const file = fileRef.current?.files?.[0]
    if (!currentUser || !file || !title.trim()) return
    setUploading(true)
    try {
      await notesService.uploadNote(file, {
        title: title.trim(),
        subject,
        description: description.trim(),
        uploadedBy: currentUser.uid,
        uploaderName: currentUser.displayName ?? 'Student',
      })
      setTitle('')
      setDescription('')
      if (fileRef.current) fileRef.current.value = ''
      await loadNotes()
    } finally {
      setUploading(false)
    }
  }

  return (
    <AppShell>
      <Eyebrow>NOTES</Eyebrow>
      <h1 className="mt-2 text-3xl font-semibold text-white" style={{ fontFamily: 'var(--font-display)' }}>Study material sharing</h1>
      <p className="mt-1 text-[#CBD5E1]">Upload and download notes via Firebase Storage.</p>

      <GlassCard className="mt-8 p-5">
        <h2 className="font-semibold text-white">Upload notes</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="DBMS Unit 3 Notes" />
          <div>
            <label className="mb-1.5 block text-xs font-medium text-[#CBD5E1]">Subject</label>
            <select value={subject} onChange={(e) => setSubject(e.target.value)} className="w-full rounded-xl border border-white/10 bg-white/[0.05] px-3.5 py-2.5 text-sm text-white outline-none">
              {subjects.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <Input label="Description" value={description} onChange={(e) => setDescription(e.target.value)} className="sm:col-span-2" />
          <div className="sm:col-span-2">
            <input ref={fileRef} type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.txt" className="text-sm text-[#CBD5E1]" />
          </div>
        </div>
        <Button className="mt-4" onClick={handleUpload} disabled={uploading}>
          <Upload size={16} /> {uploading ? 'Uploading...' : 'Upload to Storage'}
        </Button>
      </GlassCard>

      <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {notes.length === 0 ? (
          <GlassCard className="col-span-full p-8 text-center text-[#CBD5E1]">No notes uploaded yet.</GlassCard>
        ) : notes.map((note) => (
          <GlassCard key={note.id} className="p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#10B981]/15 text-[#10B981]">
                <FileText size={18} />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="truncate font-semibold text-white">{note.title}</h2>
                <p className="mt-1 text-xs text-[#CBD5E1]">By {note.uploaderName}</p>
                <Badge className="mt-2" tone="neutral">{note.subject}</Badge>
              </div>
            </div>
            <p className="mt-3 text-sm text-[#CBD5E1]">{note.description || note.fileName}</p>
            <a href={note.fileUrl} target="_blank" rel="noopener noreferrer" className="mt-4 block">
              <Button variant="secondary" className="w-full"><Download size={16} /> Download</Button>
            </a>
          </GlassCard>
        ))}
      </div>
    </AppShell>
  )
}
