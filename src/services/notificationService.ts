import { collection, doc, onSnapshot, query, updateDoc, where } from 'firebase/firestore'
import { db } from '../firebase'
import type { Notification } from '../types/models'

export const notificationService = {
  listen(userId: string, callback: (items: Notification[]) => void, onError?: (error: Error) => void) {
    return onSnapshot(query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
    ), (snap) => {
      callback(
        snap.docs
          .map((docSnap) => ({ id: docSnap.id, ...(docSnap.data() as Omit<Notification, 'id'>) }))
          .sort((left, right) => (right.createdAt?.toMillis?.() ?? 0) - (left.createdAt?.toMillis?.() ?? 0))
      )
    }, (error) => {
      onError?.(error)
    })
  },

  async markAsRead(notificationId: string) {
    await updateDoc(doc(db, 'notifications', notificationId), { read: true })
  },
}
