import { collection, doc, getDoc, getDocs, orderBy, query, serverTimestamp, updateDoc, where, writeBatch, addDoc, deleteDoc } from 'firebase/firestore'
import { db } from '../firebase'
import type { FriendRequest, Friendship, User } from '../types/models'

export const friendService = {
  async sendRequest(senderId: string, receiverId: string) {
    const existingQuery = query(
      collection(db, 'friend_requests'),
      where('senderId', 'in', [senderId, receiverId]),
      where('receiverId', 'in', [senderId, receiverId]),
      where('status', '==', 'pending')
    )
    const existing = await getDocs(existingQuery)
    if (!existing.empty) return existing.docs[0].id

    const ref = await addDoc(collection(db, 'friend_requests'), {
      senderId,
      receiverId,
      status: 'pending',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })

    await addDoc(collection(db, 'notifications'), {
      userId: receiverId,
      type: 'friend_request',
      message: 'You received a new friend request.',
      read: false,
      link: '/friend-requests',
      createdAt: serverTimestamp(),
    })

    return ref.id
  },

  async acceptRequest(requestId: string) {
    const requestRef = doc(db, 'friend_requests', requestId)
    const requestSnap = await getDoc(requestRef)
    if (!requestSnap.exists()) return

    const request = requestSnap.data() as FriendRequest
    const batch = writeBatch(db)
    batch.update(requestRef, { status: 'accepted', updatedAt: serverTimestamp() })
    batch.set(doc(collection(db, 'friendships')), {
      userIdA: request.senderId,
      userIdB: request.receiverId,
      createdAt: serverTimestamp(),
    })
    batch.set(doc(collection(db, 'notifications')), {
      userId: request.senderId,
      type: 'friend_accepted',
      message: 'Your friend request was accepted.',
      read: false,
      link: '/friends',
      createdAt: serverTimestamp(),
    })
    await batch.commit()
  },

  async declineRequest(requestId: string) {
    await updateDoc(doc(db, 'friend_requests', requestId), { status: 'declined', updatedAt: serverTimestamp() })
  },

  async removeFriend(userId: string, friendId: string) {
    const snap = await getDocs(collection(db, 'friendships'))
    const match = snap.docs.find((docSnap) => {
      const friendship = docSnap.data() as Friendship
      return (friendship.userIdA === userId && friendship.userIdB === friendId) || (friendship.userIdA === friendId && friendship.userIdB === userId)
    })
    if (match) {
      await deleteDoc(doc(db, 'friendships', match.id))
    }
  },

  async getFriends(userId: string) {
    const snap = await getDocs(collection(db, 'friendships'))
    const friendships = snap.docs
      .map((docSnap) => ({ id: docSnap.id, ...(docSnap.data() as Omit<Friendship, 'id'>) }))
      .filter((item) => item.userIdA === userId || item.userIdB === userId)

    const users = await Promise.all(
      friendships.map(async (friendship) => {
        const friendId = friendship.userIdA === userId ? friendship.userIdB : friendship.userIdA
        const userSnap = await getDoc(doc(db, 'users', friendId))
        return userSnap.exists() ? ({ uid: friendId, ...(userSnap.data() as Omit<User, 'uid'>) } as User) : null
      })
    )

    return users.filter(Boolean) as User[]
  },

  async getRequests(userId: string) {
    const sentSnap = await getDocs(query(collection(db, 'friend_requests'), where('senderId', '==', userId), orderBy('createdAt', 'desc')))
    const receivedSnap = await getDocs(query(collection(db, 'friend_requests'), where('receiverId', '==', userId), orderBy('createdAt', 'desc')))
    const mapRequest = (docSnap: any) => ({ id: docSnap.id, ...(docSnap.data() as Omit<FriendRequest, 'id'>) })
    return {
      sent: sentSnap.docs.map(mapRequest),
      received: receivedSnap.docs.map(mapRequest).filter((item: FriendRequest) => item.status === 'pending'),
    }
  },
}
