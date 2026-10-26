import { arrayUnion, collection, deleteDoc, doc, getDocs, onSnapshot, orderBy, query, serverTimestamp, updateDoc, where } from 'firebase/firestore'
import { db } from '../firebase'
import type { Report, SupportTicket, User } from '../types/models'

export const adminService = {
  async getAllUsers() {
    const snap = await getDocs(query(collection(db, 'users'), orderBy('createdAt', 'desc')))
    return snap.docs.map((d) => ({ uid: d.id, ...(d.data() as Omit<User, 'uid'>) } as User))
  },

  async getPendingReports() {
    const snap = await getDocs(
      query(collection(db, 'reports'), where('status', '==', 'pending'), orderBy('createdAt', 'desc'))
    )
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Report, 'id'>) }))
  },

  async resolveReport(reportId: string, status: 'resolved' | 'dismissed') {
    await updateDoc(doc(db, 'reports', reportId), { status })
  },

  async resolveReportWithAction(
    reportId: string,
    actionTaken: 'banned' | 'no_action' | 'dismissed',
    banDays?: number | null,
    note?: string
  ) {
    await updateDoc(doc(db, 'reports', reportId), {
      status: actionTaken === 'banned' ? 'resolved' : 'dismissed',
      actionTaken,
      banDays: banDays ?? null,
      actionNote: note || '',
      resolvedAt: serverTimestamp(),
    })
  },

  async getSupportTickets() {
    const snap = await getDocs(collection(db, 'support_tickets'))
    return snap.docs
      .map((d) => ({ id: d.id, ...(d.data() as Omit<SupportTicket, 'id'>) } as SupportTicket))
      .sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0))
  },

  listenToSupportTickets(callback: (tickets: SupportTicket[]) => void) {
    return onSnapshot(collection(db, 'support_tickets'), (snap) => {
      const tickets = snap.docs
        .map((d) => ({ id: d.id, ...(d.data() as Omit<SupportTicket, 'id'>) } as SupportTicket))
        .sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0))
      callback(tickets)
    })
  },

  async resolveTicket(ticketId: string, status: 'open' | 'in_progress' | 'resolved' | 'closed') {
    await updateDoc(doc(db, 'support_tickets', ticketId), {
      status,
      updatedAt: serverTimestamp(),
    })
  },

  async addAdminComment(
    ticketId: string,
    adminId: string,
    adminName: string,
    message: string,
    enableReply: boolean = true
  ) {
    const newReply = {
      id: `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      senderId: adminId,
      senderName: adminName,
      senderRole: 'admin' as const,
      message: message.trim(),
      createdAt: Date.now(),
    }
    await updateDoc(doc(db, 'support_tickets', ticketId), {
      replies: arrayUnion(newReply),
      canUserReply: enableReply,
      status: 'in_progress',
      updatedAt: serverTimestamp(),
    })
  },

  async toggleUserReply(ticketId: string, canUserReply: boolean) {
    await updateDoc(doc(db, 'support_tickets', ticketId), {
      canUserReply,
      updatedAt: serverTimestamp(),
    })
  },

  async deleteTicket(ticketId: string) {
    await deleteDoc(doc(db, 'support_tickets', ticketId))
  },

  async suspendUser(uid: string) {
    await updateDoc(doc(db, 'users', uid), { accountStatus: 'suspended' })
  },

  async banUser(uid: string, days: number | null, reason?: string) {
    const banExpiresAt = days && days > 0 ? Date.now() + days * 24 * 60 * 60 * 1000 : null
    await updateDoc(doc(db, 'users', uid), {
      accountStatus: 'banned',
      banExpiresAt,
      banReason: reason || 'Violation of NovaTalk Community Guidelines',
      bannedAt: Date.now(),
    })
  },

  async unbanUser(uid: string) {
    await updateDoc(doc(db, 'users', uid), {
      accountStatus: 'active',
      banExpiresAt: null,
      banReason: null,
      bannedAt: null,
    })
  },

  async deleteUser(uid: string) {
    // 1. Delete user profile document from users collection
    await deleteDoc(doc(db, 'users', uid))

    // 2. Clean up any symmetric friendships
    try {
      const [leftFriends, rightFriends] = await Promise.all([
        getDocs(query(collection(db, 'friendships'), where('userIdA', '==', uid))),
        getDocs(query(collection(db, 'friendships'), where('userIdB', '==', uid))),
      ])
      const friendshipDeletions = [...leftFriends.docs, ...rightFriends.docs].map((d) => deleteDoc(d.ref))
      await Promise.allSettled(friendshipDeletions)
    } catch (e) {
      console.warn('Unable to clean up friendships for deleted user', e)
    }

    // 3. Clean up pending friend requests
    try {
      const [sentRequests, receivedRequests] = await Promise.all([
        getDocs(query(collection(db, 'friend_requests'), where('senderId', '==', uid))),
        getDocs(query(collection(db, 'friend_requests'), where('receiverId', '==', uid))),
      ])
      const requestDeletions = [...sentRequests.docs, ...receivedRequests.docs].map((d) => deleteDoc(d.ref))
      await Promise.allSettled(requestDeletions)
    } catch (e) {
      console.warn('Unable to clean up friend requests for deleted user', e)
    }

    // 4. Clean up user settings document
    try {
      await deleteDoc(doc(db, `users/${uid}/settings`, 'default'))
    } catch (e) {
      console.warn('Unable to clean up settings for deleted user', e)
    }
  },

  async getStats() {
    const [usersSnap, reportsSnap, groupsSnap, ticketsSnap] = await Promise.all([
      getDocs(collection(db, 'users')),
      getDocs(query(collection(db, 'reports'), where('status', '==', 'pending'))),
      getDocs(collection(db, 'groups')),
      getDocs(collection(db, 'support_tickets')),
    ])
    const now = Date.now()
    const staleUserIds: string[] = []
    let online = 0

    for (const d of usersSnap.docs) {
      const u = d.data() as User
      if (u.online) {
        const lastSeenMillis = u.lastSeen?.toMillis?.() ?? 0
        if (lastSeenMillis > 0 && now - lastSeenMillis < 75_000) {
          online++
        } else {
          // User document has online: true, but heartbeat is dead (tab closed/crashed)
          staleUserIds.push(d.id)
        }
      }
    }

    // Auto-heal stale presence flags in Firestore asynchronously
    if (staleUserIds.length > 0) {
      void Promise.allSettled(
        staleUserIds.map((id) =>
          updateDoc(doc(db, 'users', id), {
            online: false,
            searchingForStudyPartner: false,
          })
        )
      )
    }

    const openTickets = ticketsSnap.docs.filter((d) => {
      const status = (d.data() as SupportTicket).status
      return status === 'open' || !status
    }).length

    return {
      totalUsers: usersSnap.size,
      onlineUsers: online,
      pendingReports: reportsSnap.size,
      communities: groupsSnap.size,
      openTickets,
      totalTickets: ticketsSnap.size,
    }
  },
}
