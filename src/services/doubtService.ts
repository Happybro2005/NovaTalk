import { addDoc, collection, getDocs, orderBy, query, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'
import { categorizeDoubt } from './nlpService'
import type { AcademicDoubt } from '../types/models'

export const doubtService = {
  async getDoubts() {
    const snap = await getDocs(query(collection(db, 'doubts'), orderBy('createdAt', 'desc')))
    return snap.docs.map((docSnap) => ({ id: docSnap.id, ...(docSnap.data() as Omit<AcademicDoubt, 'id'>) }))
  },

  async postDoubt(data: { authorId: string; authorName: string; title: string; content: string }) {
    const { category, confidence } = categorizeDoubt(`${data.title} ${data.content}`)
    const ref = await addDoc(collection(db, 'doubts'), {
      ...data,
      category,
      nlpConfidence: confidence,
      createdAt: serverTimestamp(),
    })
    return { id: ref.id, category, confidence }
  },
}
