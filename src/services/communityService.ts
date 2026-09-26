import { addDoc, collection, doc, getDocs, increment, orderBy, query, serverTimestamp, updateDoc } from 'firebase/firestore'
import { db } from '../firebase'
import type { Community } from '../types/models'

export const communityService = {
  async getCommunities() {
    const snap = await getDocs(query(collection(db, 'communities'), orderBy('memberCount', 'desc')))
    return snap.docs.map((docSnap) => ({ id: docSnap.id, ...(docSnap.data() as Omit<Community, 'id'>) }))
  },

  async joinCommunity(userId: string, communityId: string) {
    await addDoc(collection(db, 'community_memberships'), {
      userId,
      communityId,
      joinedAt: serverTimestamp(),
    })
    await updateDoc(doc(db, 'communities', communityId), { memberCount: increment(1) })
  },
}
