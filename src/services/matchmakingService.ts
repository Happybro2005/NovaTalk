import { collection, getDoc, getDocs, limit, query, serverTimestamp, where, doc, updateDoc, writeBatch } from 'firebase/firestore'
import { db } from '../firebase'
import type { User } from '../types/models'

export const matchmakingService = {
  async joinStudyQueue(userId: string) {
    await updateDoc(doc(db, 'users', userId), {
      online: true,
      searchingForStudyPartner: true,
      lastSeen: serverTimestamp(),
    })
  },

  async leaveStudyQueue(userId: string) {
    await updateDoc(doc(db, 'users', userId), {
      searchingForStudyPartner: false,
      lastSeen: serverTimestamp(),
    })
  },

  async findMatch(userId: string) {
    const currentUserSnap = await getDoc(doc(db, 'users', userId))
    const currentUser = currentUserSnap.data() as Omit<User, 'uid'> | undefined
    if (!currentUser) return null

    const queueSnap = await getDocs(
      query(
        collection(db, 'users'),
        where('online', '==', true),
        where('searchingForStudyPartner', '==', true),
        limit(25)
      )
    )

    const candidates = queueSnap.docs
      .map((docSnap) => ({ uid: docSnap.id, ...(docSnap.data() as Omit<User, 'uid'>) }))
      .filter((candidate) => candidate.uid !== userId)

    if (candidates.length === 0) {
      return null
    }

    const scoreCandidate = (candidate: User) => {
      let score = 0
      if (candidate.department && candidate.department === currentUser.department) score += 5
      if (candidate.semester && candidate.semester === currentUser.semester) score += 4

      const currentSubjects = currentUser.subjects ?? []
      const currentInterests = currentUser.interests ?? []
      const currentSkills = currentUser.skills ?? []
      const sharedSubjects = (candidate.subjects ?? []).filter((subject) => currentSubjects.includes(subject)).length
      const sharedInterests = (candidate.interests ?? []).filter((interest) => currentInterests.includes(interest)).length
      const sharedSkills = (candidate.skills ?? []).filter((skill) => currentSkills.includes(skill)).length

      score += sharedSubjects * 3
      score += sharedInterests * 2
      score += sharedSkills
      return score
    }

    const scoredCandidates = candidates
      .map((candidate) => ({ candidate, score: scoreCandidate(candidate) }))
      .sort((a, b) => b.score - a.score)

    const other = scoredCandidates[0]?.candidate
    if (!other) {
      return null
    }

    const batch = writeBatch(db)
    batch.update(doc(db, 'users', userId), { searchingForStudyPartner: false, lastSeen: serverTimestamp() })
    batch.update(doc(db, 'users', other.uid), { searchingForStudyPartner: false, lastSeen: serverTimestamp() })

    const convRef = doc(collection(db, 'conversations'))
    batch.set(convRef, {
      type: 'study',
      createdBy: null,
      name: 'Study Match',
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
