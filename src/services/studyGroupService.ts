import { addDoc, collection, doc, getDoc, getDocs, increment, orderBy, query, serverTimestamp, setDoc, updateDoc, where, writeBatch } from 'firebase/firestore'
import { db } from '../firebase'
import { chatService } from './chatService'
import type { Group, GroupRequest, StudyGroup } from '../types/models'

export const studyGroupService = {
  async getStudyGroups() {
    const snap = await getDocs(query(collection(db, 'groups'), orderBy('memberCount', 'desc')))
    if (!snap.empty) {
      return snap.docs.map((docSnap) => ({ id: docSnap.id, ...(docSnap.data() as Omit<StudyGroup, 'id'>) }))
    }
    const legacySnap = await getDocs(query(collection(db, 'studyGroups'), orderBy('memberCount', 'desc')))
    return legacySnap.docs.map((docSnap) => ({ id: docSnap.id, ...(docSnap.data() as Omit<StudyGroup, 'id'>) }))
  },

  async createStudyGroup(data: { name: string; subject: string; description: string; createdBy: string }) {
    const ref = await addDoc(collection(db, 'groups'), {
      ...data,
      memberIds: [data.createdBy],
      memberCount: 1,
      createdAt: serverTimestamp(),
    })
    return ref.id
  },

  async createGroup(data: { name: string; topic: string; description: string; creatorId: string }) {
    const ref = doc(collection(db, 'groups'))
    await setDoc(ref, {
      name: data.name,
      topic: data.topic,
      description: data.description,
      createdBy: data.creatorId,
      adminIds: [data.creatorId],
      memberIds: [data.creatorId],
      memberCount: 1,
      conversationId: '',
      createdAt: serverTimestamp(),
    })
    const conversationId = await chatService.createGroupChat(data.creatorId, data.name, ref.id)
    await updateDoc(ref, { conversationId })
    return ref.id
  },

  async inviteFriends(groupId: string, groupName: string, senderId: string, receiverIds: string[]) {
    const uniqueReceiverIds = [...new Set(receiverIds)].filter((receiverId) => receiverId && receiverId !== senderId)
    if (uniqueReceiverIds.length === 0) return

    const existingSnapshot = await getDocs(query(
      collection(db, 'group_requests'),
      where('senderId', '==', senderId),
    ))
    const existingRequests = existingSnapshot.docs
      .map((item) => ({ id: item.id, ...(item.data() as Omit<GroupRequest, 'id'>) }))
      .filter((request) => request.groupId === groupId)

    const batch = writeBatch(db)
    let hasWrites = false
    uniqueReceiverIds.forEach((receiverId) => {
      const requestsForFriend = existingRequests.filter((request) => request.receiverId === receiverId)
      if (requestsForFriend.some((request) => request.status === 'pending' || request.status === 'accepted')) return

      const rejectedRequest = requestsForFriend.find((request) => request.status === 'rejected')
      const requestRef = rejectedRequest
        ? doc(db, 'group_requests', rejectedRequest.id)
        : doc(collection(db, 'group_requests'))
      const timestamp = serverTimestamp()
      if (rejectedRequest) {
        batch.update(requestRef, { status: 'pending', groupName, updatedAt: timestamp })
      } else {
        batch.set(requestRef, {
          groupId,
          groupName,
          senderId,
          receiverId,
          status: 'pending',
          createdAt: timestamp,
          updatedAt: timestamp,
        })
      }
      batch.set(doc(collection(db, 'notifications')), {
        userId: receiverId,
        type: 'system',
        message: `You were invited to join ${groupName}.`,
        read: false,
        link: '/friend-requests',
        createdAt: timestamp,
      })
      hasWrites = true
    })
    if (hasWrites) await batch.commit()
  },

  async getRequests(userId: string) {
    const snapshot = await getDocs(query(collection(db, 'group_requests'), where('receiverId', '==', userId)))
    return snapshot.docs.map((item) => ({ id: item.id, ...(item.data() as Omit<GroupRequest, 'id'>) }))
  },

  async getGroupActivity(groupId: string, senderId: string) {
    const snapshot = await getDocs(query(collection(db, 'group_requests'), where('senderId', '==', senderId)))
    return snapshot.docs
      .map((item) => ({ id: item.id, ...(item.data() as Omit<GroupRequest, 'id'>) }))
      .filter((request) => request.groupId === groupId)
      .sort((left, right) => (right.updatedAt?.toMillis?.() ?? 0) - (left.updatedAt?.toMillis?.() ?? 0))
  },

  async respondToRequest(requestId: string, userId: string, accepted: boolean) {
    const requestRef = doc(db, 'group_requests', requestId)
    const requestSnapshot = await getDoc(requestRef)
    if (!requestSnapshot.exists()) return
    const request = requestSnapshot.data() as GroupRequest
    if (request.receiverId !== userId || request.status !== 'pending') return
    const groupRef = doc(db, 'groups', request.groupId)
    const groupSnapshot = await getDoc(groupRef)
    if (!groupSnapshot.exists()) return
    const group = groupSnapshot.data() as Group
    const batch = writeBatch(db)
    batch.update(requestRef, { status: accepted ? 'accepted' : 'rejected', updatedAt: serverTimestamp() })
    if (accepted && !group.memberIds.includes(userId)) {
      batch.update(groupRef, { memberIds: [...group.memberIds, userId], memberCount: group.memberCount + 1 })
    }
    await batch.commit()
    if (accepted) await chatService.addGroupMember(group.conversationId, userId)
  },

  async getGroups(search = ''): Promise<Group[]> {
    const snap = await getDocs(query(collection(db, 'groups')))
    const normalized = search.trim().toLowerCase()
    return snap.docs
      .map((item) => ({ id: item.id, ...(item.data() as Omit<Group, 'id'>) }))
      .filter((group) => !normalized || `${group.name} ${group.description} ${group.topic}`.toLowerCase().includes(normalized))
      .sort((left, right) => right.memberCount - left.memberCount)
  },

  async joinGroup(userId: string, groupId: string) {
    const groupRef = doc(db, 'groups', groupId)
    const snapshot = await getDoc(groupRef)
    if (!snapshot.exists()) return
    const group = snapshot.data() as Group
    if (group.memberIds.includes(userId)) return
    await updateDoc(groupRef, { memberIds: [...group.memberIds, userId], memberCount: group.memberCount + 1 })
  },

  async updateAdmin(groupId: string, actorId: string, memberId: string, makeAdmin: boolean) {
    const groupRef = doc(db, 'groups', groupId)
    const snapshot = await getDoc(groupRef)
    if (!snapshot.exists()) return
    const group = snapshot.data() as Group
    if (group.createdBy !== actorId) throw new Error('Only the group creator can manage admins.')
    if (memberId === group.createdBy && !makeAdmin) throw new Error('The group creator must remain an admin.')
    const adminIds = makeAdmin ? [...new Set([...group.adminIds, memberId])] : group.adminIds.filter((id) => id !== memberId)
    await updateDoc(groupRef, { adminIds })
  },

  async removeMember(groupId: string, actorId: string, memberId: string) {
    const groupRef = doc(db, 'groups', groupId)
    const snapshot = await getDoc(groupRef)
    if (!snapshot.exists()) return
    const group = snapshot.data() as Group
    if (!group.adminIds.includes(actorId) || memberId === group.createdBy) throw new Error('Only a group admin can remove members, and the creator cannot be removed.')
    if (group.adminIds.includes(memberId)) throw new Error('Only the group creator can remove admin privileges.')
    await updateDoc(groupRef, {
      memberIds: group.memberIds.filter((id) => id !== memberId),
      adminIds: group.adminIds.filter((id) => id !== memberId),
      memberCount: Math.max(1, group.memberCount - 1),
    })
  },

  async joinStudyGroup(userId: string, groupId: string) {
    const groupSnap = await getDocs(query(collection(db, 'groups')))
    let targetCollection = 'groups'
    let group = groupSnap.docs.find((d) => d.id === groupId)?.data() as StudyGroup | undefined
    if (!group) {
      const legacySnap = await getDocs(query(collection(db, 'studyGroups')))
      group = legacySnap.docs.find((d) => d.id === groupId)?.data() as StudyGroup | undefined
      targetCollection = 'studyGroups'
    }
    if (!group || group.memberIds.includes(userId)) return

    await updateDoc(doc(db, targetCollection, groupId), {
      memberIds: [...group.memberIds, userId],
      memberCount: increment(1),
    })
  },
}
