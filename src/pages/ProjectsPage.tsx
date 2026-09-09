import { useEffect, useState } from 'react'
import { FolderKanban, PlusCircle } from 'lucide-react'
import AppShell from '../components/AppShell'
import { Badge, Button, GlassCard, Eyebrow, Input } from '../components/ui'
import { useAuth } from '../contexts/AuthContext'
import { projectService } from '../services/projectService'
import type { Project } from '../types/models'

const subjects = ['DSA', 'DBMS', 'Operating Systems', 'Networks', 'Machine Learning', 'Calculus']
const skills = ['Coding', 'Presentation', 'Research', 'Design', 'Mentoring', 'Debugging']

export default function ProjectsPage() {
  const { currentUser } = useAuth()
  const [projects, setProjects] = useState<Project[]>([])
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [subject, setSubject] = useState(subjects[0])
  const [selectedSkills, setSelectedSkills] = useState<string[]>([])

  async function loadProjects() {
    setProjects(await projectService.getProjects())
  }

  useEffect(() => { loadProjects() }, [])

  async function handleCreate() {
    if (!currentUser || !title.trim()) return
    await projectService.createProject({
      title: title.trim(),
      description: description.trim(),
      subject,
      createdBy: currentUser.uid,
      requiredSkills: selectedSkills,
    })
    setTitle('')
    setDescription('')
    setSelectedSkills([])
    setShowForm(false)
    await loadProjects()
  }

  return (
    <AppShell>
      <Eyebrow>PROJECTS</Eyebrow>
      <div className="mt-2 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-white" style={{ fontFamily: 'var(--font-display)' }}>Project collaboration spaces</h1>
          <p className="mt-1 text-[#CBD5E1]">Form teams and manage academic projects together.</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}><PlusCircle size={16} /> New project</Button>
      </div>

      {showForm && (
        <GlassCard className="mt-6 p-5">
          <h2 className="font-semibold text-white">Create project</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Input label="Project title" value={title} onChange={(e) => setTitle(e.target.value)} />
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[#CBD5E1]">Subject</label>
              <select value={subject} onChange={(e) => setSubject(e.target.value)} className="w-full rounded-xl border border-white/10 bg-white/[0.05] px-3.5 py-2.5 text-sm text-white outline-none">
                {subjects.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <Input label="Description" value={description} onChange={(e) => setDescription(e.target.value)} className="sm:col-span-2" />
          </div>
          <div className="mt-4">
            <p className="mb-2 text-xs font-medium text-[#CBD5E1]">Required skills</p>
            <div className="flex flex-wrap gap-2">
              {skills.map((skill) => (
                <button key={skill} type="button" onClick={() => setSelectedSkills((prev) => prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill])}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${selectedSkills.includes(skill) ? 'bg-[#4F8CFF] text-white' : 'bg-white/[0.06] text-[#CBD5E1] hover:bg-white/10'}`}>
                  {skill}
                </button>
              ))}
            </div>
          </div>
          <Button className="mt-4" onClick={handleCreate}>Create project</Button>
        </GlassCard>
      )}

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {projects.length === 0 ? (
          <GlassCard className="col-span-full p-8 text-center text-[#CBD5E1]">No projects yet. Start one!</GlassCard>
        ) : projects.map((project) => (
          <GlassCard key={project.id} className="p-5">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#7C3AED]/15 text-[#7C3AED]">
                <FolderKanban size={22} />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="font-semibold text-white">{project.title}</h2>
                <p className="mt-1 text-sm text-[#CBD5E1]">{project.description}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge tone="neutral">{project.subject}</Badge>
                  <Badge tone={project.status === 'open' ? 'success' : 'warning'}>{project.status.replace('_', ' ')}</Badge>
                  <Badge tone="neutral">{project.memberIds.length} members</Badge>
                </div>
              </div>
            </div>
            <Button className="mt-5 w-full" variant="secondary" onClick={async () => { if (currentUser) { await projectService.joinProject(currentUser.uid, project.id); await loadProjects() } }}>
              Join project
            </Button>
          </GlassCard>
        ))}
      </div>
    </AppShell>
  )
}
