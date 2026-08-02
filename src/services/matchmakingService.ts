import { collection, getDocs, limit, query, serverTimestamp, where, doc, updateDoc, writeBatch } from 'firebase/firestore'
import { db } from '../firebase'
import type { User } from '../types/models'

export const matchmakingService = {
  async joinStrangerQueue(userId: string) {
    await updateDoc(doc(db, 'users', userId), {
      online: true,
      searchingForStranger: true,
      lastSeen: serverTimestamp(),
    })
  },

  async leaveStrangerQueue(userId: string) {
    await updateDoc(doc(db, 'users', userId), {
      searchingForStranger: false,
      lastSeen: serverTimestamp(),
    })
  },

  async findMatch(userId: string) {
    const queueSnap = await getDocs(
      query(
        collection(db, 'users'),
        where('online', '==', true),
        where('searchingForStranger', '==', true),
        limit(25)
      )
    )

    const candidates = queueSnap.docs
      .map((docSnap) => ({ uid: docSnap.id, ...(docSnap.data() as Omit<User, 'uid'>) }))
      .filter((candidate) => candidate.uid !== userId)

    const other = candidates[0]
    if (!other) return null

    const batch = writeBatch(db)
    batch.update(doc(db, 'users', userId), { searchingForStranger: false, lastSeen: serverTimestamp() })
    batch.update(doc(db, 'users', other.uid), { searchingForStranger: false, lastSeen: serverTimestamp() })

    const convRef = doc(collection(db, 'conversations'))
    batch.set(convRef, {
      type: 'stranger',
      createdBy: null,
      name: 'Stranger Chat',
      avatarUrl: null,
      lastMessage: null,
      participantIds: [userId, other.uid],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    } as any)
    await batch.commit()

    return convRef.id
  },
}
