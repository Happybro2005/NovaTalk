import { addDoc, collection, doc, getDocs, onSnapshot, orderBy, query, serverTimestamp, updateDoc } from 'firebase/firestore'
import { db } from '../firebase'
import type { CampusEvent, EventPost } from '../types/models'

export const eventService = {
  async getEvents() {
    const snap = await getDocs(query(collection(db, 'events'), orderBy('createdAt', 'desc')))
    return snap.docs.map((docSnap) => ({ id: docSnap.id, ...(docSnap.data() as Omit<CampusEvent, 'id'>) }))
  },

  async createEvent(data: {
    title: string
    description: string
    type: CampusEvent['type']
    date: string
    location: string
    createdBy: string
  }) {
    const ref = await addDoc(collection(db, 'events'), {
      ...data,
      participantIds: [data.createdBy],
      createdAt: serverTimestamp(),
    })
    return ref.id
  },

  async joinEvent(userId: string, eventId: string) {
    const snap = await getDocs(query(collection(db, 'events')))
    const event = snap.docs.find((d) => d.id === eventId)?.data() as CampusEvent | undefined
    if (!event || event.participantIds.includes(userId)) return

    await updateDoc(doc(db, 'events', eventId), {
      participantIds: [...event.participantIds, userId],
    })
  },

  subscribeToEventPosts(eventId: string, callback: (posts: EventPost[]) => void) {
    const q = query(collection(db, 'events', eventId, 'posts'), orderBy('createdAt', 'asc'))
    return onSnapshot(q, (snap) => {
      callback(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<EventPost, 'id'>) })))
    })
  },

  async addEventPost(eventId: string, data: { authorId: string; authorName: string; content: string }) {
    await addDoc(collection(db, 'events', eventId, 'posts'), {
      ...data,
      eventId,
      createdAt: serverTimestamp(),
    })
  },
}
