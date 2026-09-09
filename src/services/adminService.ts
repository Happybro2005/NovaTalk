import { collection, doc, getDocs, orderBy, query, updateDoc, where } from 'firebase/firestore'
import { db } from '../firebase'
import type { Report, User } from '../types/models'

export const adminService = {
  async getAllUsers() {
    const snap = await getDocs(query(collection(db, 'users'), orderBy('createdAt', 'desc')))
    return snap.docs.map((d) => d.data() as User)
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

  async suspendUser(uid: string) {
    await updateDoc(doc(db, 'users', uid), { accountStatus: 'suspended' })
  },

  async getStats() {
    const [usersSnap, reportsSnap, communitiesSnap] = await Promise.all([
      getDocs(collection(db, 'users')),
      getDocs(query(collection(db, 'reports'), where('status', '==', 'pending'))),
      getDocs(collection(db, 'communities')),
    ])
    const online = usersSnap.docs.filter((d) => (d.data() as User).online).length
    return {
      totalUsers: usersSnap.size,
      onlineUsers: online,
      pendingReports: reportsSnap.size,
      communities: communitiesSnap.size,
    }
  },
}
