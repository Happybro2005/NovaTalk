import {
  addDoc,
  arrayUnion,
  collection,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore'
import { db } from '../firebase'
import type { SupportTicket, TicketReply } from '../types/models'

export const supportService = {
  async createTicket(
    userId: string,
    subject: string,
    message: string,
    userName: string = '',
    userEmail: string = ''
  ) {
    const ref = await addDoc(collection(db, 'support_tickets'), {
      userId,
      userName,
      userEmail,
      subject: subject.trim(),
      message: message.trim(),
      status: 'open',
      canUserReply: false,
      replies: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    return ref.id
  },

  listenToUserTickets(userId: string, callback: (tickets: SupportTicket[]) => void) {
    const q = query(
      collection(db, 'support_tickets'),
      where('userId', '==', userId)
    )

    return onSnapshot(q, (snapshot) => {
      const tickets = snapshot.docs
        .map((d) => ({ id: d.id, ...(d.data() as Omit<SupportTicket, 'id'>) } as SupportTicket))
        .sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0))
      callback(tickets)
    }, (error) => {
      console.error('Error listening to user support tickets:', error)
      callback([])
    })
  },

  async replyToTicket(
    ticketId: string,
    senderId: string,
    senderName: string,
    message: string
  ) {
    const newReply: TicketReply = {
      id: `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      senderId,
      senderName,
      senderRole: 'user',
      message: message.trim(),
      createdAt: Date.now(),
    }

    await updateDoc(doc(db, 'support_tickets', ticketId), {
      replies: arrayUnion(newReply),
      updatedAt: serverTimestamp(),
    })
  },
}
