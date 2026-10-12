import { collection, doc, getDoc, getDocs, limit, query, runTransaction, serverTimestamp, updateDoc, where } from 'firebase/firestore'
import { db } from '../firebase'
import type { User } from '../types/models'

export const matchmakingService = {
  async skipMatch(conversationId: string, userId: string) {
    const skipEventId = doc(collection(db, 'conversations')).id
    const skipUntil = Date.now() + 5_000
    await updateDoc(doc(db, 'conversations', conversationId), {
      skippedBy: userId,
      skipEventId,
      skipUntil,
      updatedAt: serverTimestamp(),
    })
    return { skipEventId, skipUntil }
  },

  async joinStudyQueue(userId: string) {
    await updateDoc(doc(db, 'users', userId), {
      online: true,
      searchingForStudyPartner: true,
      lastSeen: serverTimestamp(),
    })
  },

  async refreshQueue(userId: string) {
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

  async findMatch(userId: string, excludedUserIds: string[] = []) {
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

    const activeSince = Date.now() - 60_000
    const candidates = queueSnap.docs
      .map((docSnap) => ({ uid: docSnap.id, ...(docSnap.data() as Omit<User, 'uid'>) }))
      .filter((candidate) => candidate.uid !== userId
        && !excludedUserIds.includes(candidate.uid)
        && candidate.online
        && candidate.searchingForStudyPartner
        && candidate.lastSeen?.toMillis?.() >= activeSince)

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

    const convRef = doc(collection(db, 'conversations'))
    try {
      await runTransaction(db, async (transaction) => {
        const [currentSnapshot, otherSnapshot] = await Promise.all([
          transaction.get(doc(db, 'users', userId)),
          transaction.get(doc(db, 'users', other.uid)),
        ])
        const current = currentSnapshot.data() as Partial<User> | undefined
        const candidate = otherSnapshot.data() as Partial<User> | undefined
        const isFresh = (profile: Partial<User> | undefined) => Boolean(
          profile?.online && profile.searchingForStudyPartner && (profile.lastSeen?.toMillis?.() ?? 0) >= activeSince,
        )
        if (!isFresh(current) || !isFresh(candidate)) throw new Error('MATCH_NOT_AVAILABLE')

        transaction.update(doc(db, 'users', userId), { searchingForStudyPartner: false, lastSeen: serverTimestamp() })
        transaction.update(doc(db, 'users', other.uid), { searchingForStudyPartner: false, lastSeen: serverTimestamp() })
        transaction.set(convRef, {
          type: 'study',
          createdBy: null,
          name: 'New Friend Match',
          avatarUrl: null,
          lastMessage: null,
          participantIds: [userId, other.uid],
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        })
      })
      return convRef.id
    } catch (error) {
      if (error instanceof Error && error.message === 'MATCH_NOT_AVAILABLE') return null
      throw error
    }
  },
}
