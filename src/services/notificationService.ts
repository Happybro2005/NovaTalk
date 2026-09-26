import { collection, doc, onSnapshot, orderBy, query, updateDoc } from 'firebase/firestore'
import { db } from '../firebase'
import type { Notification } from '../types/models'

export const notificationService = {
  listen(userId: string, callback: (items: Notification[]) => void) {
    return onSnapshot(query(collection(db, 'notifications'), orderBy('createdAt', 'desc')), (snap) => {
      callback(
        snap.docs
          .map((docSnap) => ({ id: docSnap.id, ...(docSnap.data() as Omit<Notification, 'id'>) }))
          .filter((item) => item.userId === userId)
      )
    })
  },

  async markAsRead(notificationId: string) {
    await updateDoc(doc(db, 'notifications', notificationId), { read: true })
  },
}
