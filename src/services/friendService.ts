import { collection, doc, getDoc, getDocs, onSnapshot, query, serverTimestamp, updateDoc, where, writeBatch, deleteDoc } from 'firebase/firestore'
import { db } from '../firebase'
import type { FriendRequest, Friendship, User } from '../types/models'

export type FriendSearchUser = User & { pendingRequestId?: string; presenceVisible?: boolean }

function newestFirst(requests: FriendRequest[]) {
  return requests.sort((left, right) => (right.createdAt?.toMillis?.() ?? 0) - (left.createdAt?.toMillis?.() ?? 0))
}

export const friendService = {
  async searchUsers(currentUserId: string, search: string) {
    const term = search.trim().toLowerCase().replace(/^@/, '')
    if (!term) return []

    const [usersSnap, requestsSnap, leftFriendsSnap, rightFriendsSnap] = await Promise.all([
      getDocs(collection(db, 'users')),
      getDocs(query(
        collection(db, 'friend_requests'),
        where('senderId', '==', currentUserId)
      )),
      getDocs(query(collection(db, 'friendships'), where('userIdA', '==', currentUserId))),
      getDocs(query(collection(db, 'friendships'), where('userIdB', '==', currentUserId))),
    ])
    const pendingRequests = new Map(requestsSnap.docs
      .filter((request) => request.data().status === 'pending')
      .map((request) => [request.data().receiverId as string, request.id]))
    const friendIds = new Set([...leftFriendsSnap.docs, ...rightFriendsSnap.docs].map((friendship) => {
      const data = friendship.data() as Friendship
      return data.userIdA === currentUserId ? data.userIdB : data.userIdA
    }))

    const matchingUsers = usersSnap.docs
      .map((item) => ({ uid: item.id, ...(item.data() as Omit<User, 'uid'>) }) as User)
      .filter((user) => user.uid !== currentUserId && !friendIds.has(user.uid) && `${user.novaName} ${user.username}`.toLowerCase().includes(term))
      .slice(0, 20)

    return Promise.all(matchingUsers.map(async (user) => {
      const settingsSnapshot = await getDoc(doc(db, 'users', user.uid, 'settings', 'default')).catch(() => null)
      const settings = settingsSnapshot?.data() as { privacy?: { lastSeen?: 'everyone' | 'friends' | 'nobody' } } | undefined
      return {
        ...user,
        pendingRequestId: pendingRequests.get(user.uid),
        presenceVisible: settings?.privacy?.lastSeen === 'everyone',
      } satisfies FriendSearchUser
    }))
  },

  async sendRequest(senderId: string, receiverId: string) {
    const existing = await getDocs(query(collection(db, 'friend_requests'), where('senderId', '==', senderId)))
    const existingRequest = existing.docs.find((request) => request.data().receiverId === receiverId && request.data().status === 'pending')
    if (existingRequest) return existingRequest.id

    const requestRef = doc(collection(db, 'friend_requests'))
    const notificationRef = doc(collection(db, 'notifications'))
    const batch = writeBatch(db)
    batch.set(requestRef, {
      senderId,
      receiverId,
      status: 'pending',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    batch.set(notificationRef, {
      userId: receiverId,
      type: 'friend_request',
      message: 'You received a new friend request.',
      read: false,
      link: '/friend-requests',
      createdAt: serverTimestamp(),
    })
    await batch.commit()

    return requestRef.id
  },

  async cancelRequest(requestId: string, senderId: string) {
    const requestRef = doc(db, 'friend_requests', requestId)
    const requestSnap = await getDoc(requestRef)
    if (!requestSnap.exists()) return

    const request = requestSnap.data() as FriendRequest
    if (request.senderId !== senderId || request.status !== 'pending') {
      throw new Error('This friend request can no longer be canceled.')
    }
    await deleteDoc(requestRef)
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
    const [leftSnap, rightSnap] = await Promise.all([
      getDocs(query(collection(db, 'friendships'), where('userIdA', '==', userId))),
      getDocs(query(collection(db, 'friendships'), where('userIdB', '==', userId))),
    ])
    const friendships = [...leftSnap.docs, ...rightSnap.docs]
      .map((docSnap) => ({ id: docSnap.id, ...(docSnap.data() as Omit<Friendship, 'id'>) }))

    const users = await Promise.all(
      friendships.map(async (friendship) => {
        const friendId = friendship.userIdA === userId ? friendship.userIdB : friendship.userIdA
        const userSnap = await getDoc(doc(db, 'users', friendId))
        return userSnap.exists() ? ({ uid: friendId, ...(userSnap.data() as Omit<User, 'uid'>) } as User) : null
      })
    )

    return users.filter(Boolean) as User[]
  },

  async getUser(userId: string) {
    const userSnap = await getDoc(doc(db, 'users', userId))
    return userSnap.exists() ? ({ uid: userId, ...(userSnap.data() as Omit<User, 'uid'>) } as User) : null
  },

  async getRequests(userId: string) {
    const sentSnap = await getDocs(query(collection(db, 'friend_requests'), where('senderId', '==', userId)))
    const receivedSnap = await getDocs(query(collection(db, 'friend_requests'), where('receiverId', '==', userId)))
    const mapRequest = (docSnap: any) => ({ id: docSnap.id, ...(docSnap.data() as Omit<FriendRequest, 'id'>) })
    return {
      sent: newestFirst(sentSnap.docs.map(mapRequest)),
      received: newestFirst(receivedSnap.docs.map(mapRequest).filter((item: FriendRequest) => item.status === 'pending')),
    }
  },

  listenToRequests(userId: string, onUpdate: (requests: { sent: FriendRequest[]; received: FriendRequest[] }) => void, onError: (error: Error) => void) {
    let sent: FriendRequest[] = []
    let received: FriendRequest[] = []
    let sentLoaded = false
    let receivedLoaded = false
    const publish = () => {
      if (sentLoaded && receivedLoaded) onUpdate({ sent, received })
    }
    const mapRequest = (docSnap: { id: string; data: () => Record<string, unknown> }) => ({
      id: docSnap.id,
      ...(docSnap.data() as Omit<FriendRequest, 'id'>),
    })
    const unsubscribeSent = onSnapshot(
      query(collection(db, 'friend_requests'), where('senderId', '==', userId)),
      (snapshot) => {
        sent = newestFirst(snapshot.docs.map(mapRequest))
        sentLoaded = true
        publish()
      },
      onError,
    )
    const unsubscribeReceived = onSnapshot(
      query(collection(db, 'friend_requests'), where('receiverId', '==', userId)),
      (snapshot) => {
        received = newestFirst(snapshot.docs.map(mapRequest).filter((request) => request.status === 'pending'))
        receivedLoaded = true
        publish()
      },
      onError,
    )
    return () => {
      unsubscribeSent()
      unsubscribeReceived()
    }
  },
}
