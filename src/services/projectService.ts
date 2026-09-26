import { addDoc, collection, doc, getDocs, orderBy, query, serverTimestamp, updateDoc } from 'firebase/firestore'
import { db } from '../firebase'
import type { Project } from '../types/models'

export const projectService = {
  async getProjects() {
    const snap = await getDocs(query(collection(db, 'projects'), orderBy('createdAt', 'desc')))
    return snap.docs.map((docSnap) => ({ id: docSnap.id, ...(docSnap.data() as Omit<Project, 'id'>) }))
  },

  async createProject(data: {
    title: string
    description: string
    subject: string
    createdBy: string
    requiredSkills: string[]
  }) {
    const ref = await addDoc(collection(db, 'projects'), {
      ...data,
      memberIds: [data.createdBy],
      status: 'open',
      createdAt: serverTimestamp(),
    })
    return ref.id
  },

  async joinProject(userId: string, projectId: string) {
    const snap = await getDocs(query(collection(db, 'projects')))
    const project = snap.docs.find((d) => d.id === projectId)?.data() as Project | undefined
    if (!project || project.memberIds.includes(userId)) return

    await updateDoc(doc(db, 'projects', projectId), {
      memberIds: [...project.memberIds, userId],
      status: 'in_progress',
    })
  },
}
