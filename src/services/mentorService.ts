import { addDoc, collection, doc, getDocs, orderBy, query, serverTimestamp, updateDoc, where } from 'firebase/firestore'
import { db } from '../firebase'
import type { MentorRequest } from '../types/models'

export const mentorService = {
  async createRequest(data: {
    requesterId: string
    requesterName: string
    subject: string
    message: string
    department: string
    semester: string
  }) {
    const ref = await addDoc(collection(db, 'mentorRequests'), {
      ...data,
      mentorId: null,
      status: 'pending',
      createdAt: serverTimestamp(),
    })
    return ref.id
  },

  async getMyRequests(userId: string) {
    const snap = await getDocs(
      query(collection(db, 'mentorRequests'), where('requesterId', '==', userId), orderBy('createdAt', 'desc'))
    )
    return snap.docs.map((docSnap) => ({ id: docSnap.id, ...(docSnap.data() as Omit<MentorRequest, 'id'>) }))
  },

  async getOpenRequests() {
    const snap = await getDocs(
      query(collection(db, 'mentorRequests'), where('status', '==', 'pending'), orderBy('createdAt', 'desc'))
    )
    return snap.docs.map((docSnap) => ({ id: docSnap.id, ...(docSnap.data() as Omit<MentorRequest, 'id'>) }))
  },

  async acceptRequest(requestId: string, mentorId: string) {
    await updateDoc(doc(db, 'mentorRequests', requestId), {
      mentorId,
      status: 'accepted',
    })
  },
}
