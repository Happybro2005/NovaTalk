import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'

export const supportService = {
  async createTicket(userId: string, subject: string, message: string) {
    const ref = await addDoc(collection(db, 'support_tickets'), {
      userId,
      subject,
      message,
      status: 'open',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    return ref.id
  },
}
