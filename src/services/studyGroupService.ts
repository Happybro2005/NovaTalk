import { addDoc, collection, doc, getDocs, increment, orderBy, query, serverTimestamp, updateDoc } from 'firebase/firestore'
import { db } from '../firebase'
import type { StudyGroup } from '../types/models'

export const studyGroupService = {
  async getStudyGroups() {
    const snap = await getDocs(query(collection(db, 'studyGroups'), orderBy('memberCount', 'desc')))
    return snap.docs.map((docSnap) => ({ id: docSnap.id, ...(docSnap.data() as Omit<StudyGroup, 'id'>) }))
  },

  async createStudyGroup(data: { name: string; subject: string; description: string; createdBy: string }) {
    const ref = await addDoc(collection(db, 'studyGroups'), {
      ...data,
      memberIds: [data.createdBy],
      memberCount: 1,
      createdAt: serverTimestamp(),
    })
    return ref.id
  },

  async joinStudyGroup(userId: string, groupId: string) {
    const groupRef = doc(db, 'studyGroups', groupId)
    const snap = await getDocs(query(collection(db, 'studyGroups')))
    const group = snap.docs.find((d) => d.id === groupId)?.data() as StudyGroup | undefined
    if (!group || group.memberIds.includes(userId)) return

    await updateDoc(groupRef, {
      memberIds: [...group.memberIds, userId],
      memberCount: increment(1),
    })
  },
}
