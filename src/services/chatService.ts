import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  updateDoc,
  serverTimestamp,
  Timestamp,
  where,
  writeBatch,
} from 'firebase/firestore'
import { db } from '../firebase'
import type { Conversation, ConversationParticipant, Message } from '../types/models'

export const chatService = {
  async createGroupChat(creatorId: string, name: string, groupId: string) {
    const conversationRef = doc(collection(db, 'conversations'))
    await setDoc(conversationRef, {
      id: conversationRef.id,
      type: 'group',
      createdBy: creatorId,
      name,
      avatarUrl: null,
      lastMessage: null,
      participantIds: [creatorId],
      groupId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    await setDoc(doc(db, `conversations/${conversationRef.id}/participants`, creatorId), {
      uid: creatorId,
      role: 'admin',
      joinedAt: serverTimestamp(),
      mutedUntil: null,
      archived: false,
      lastReadMessageId: null,
      lastReadTimestamp: serverTimestamp(),
    })
    return conversationRef.id
  },

  async addGroupMember(conversationId: string, userId: string) {
    const conversationRef = doc(db, 'conversations', conversationId)
    const snapshot = await getDoc(conversationRef)
    if (!snapshot.exists()) return
    const conversation = snapshot.data() as Conversation
    if (conversation.participantIds.includes(userId)) return
    await updateDoc(conversationRef, { participantIds: [...conversation.participantIds, userId] })
    await setDoc(doc(db, `conversations/${conversationId}/participants`, userId), {
      uid: userId,
      role: 'member',
      joinedAt: serverTimestamp(),
      mutedUntil: null,
      archived: false,
      lastReadMessageId: null,
      lastReadTimestamp: serverTimestamp(),
    })
  },
  /**
   * Creates a new 1-on-1 Direct Message conversation
   */
  async createDM(currentUserUid: string, targetUid: string) {
    // Note: In a real app, you'd check if a DM between these two already exists first.
    
    const convRef = doc(collection(db, 'conversations'))
    
    const convData: Conversation = {
      id: convRef.id,
      type: 'dm',
      createdBy: null,
      name: null,
      avatarUrl: null,
      lastMessage: null,
      participantIds: [currentUserUid, targetUid],
      createdAt: serverTimestamp() as Timestamp,
      updatedAt: serverTimestamp() as Timestamp,
    }
    
    await setDoc(convRef, convData)
    
    // Add participant subcollections
    const p1Ref = doc(db, `conversations/${convRef.id}/participants`, currentUserUid)
    const p2Ref = doc(db, `conversations/${convRef.id}/participants`, targetUid)
    
    const p1Data: ConversationParticipant = {
      uid: currentUserUid,
      role: 'member',
      joinedAt: serverTimestamp() as Timestamp,
      mutedUntil: null,
      archived: false,
      lastReadMessageId: null,
      lastReadTimestamp: serverTimestamp() as Timestamp
    }
    
    const p2Data: ConversationParticipant = { ...p1Data, uid: targetUid }

    await Promise.all([
      setDoc(p1Ref, p1Data),
      setDoc(p2Ref, p2Data)
    ])
    
    return convRef.id
  },

  async openOrCreateDM(currentUserUid: string, targetUid: string) {
    const conversations = await getDocs(query(
      collection(db, 'conversations'),
      where('participantIds', 'array-contains', currentUserUid),
    ))
    const existing = conversations.docs.find((item) => {
      const conversation = item.data() as Conversation
      return conversation.type === 'dm'
        && conversation.participantIds.includes(targetUid)
        && conversation.messageRequestStatus !== 'pending'
        && conversation.messageRequestStatus !== 'declined'
    })
    return existing?.id ?? this.createDM(currentUserUid, targetUid)
  },

  async sendMessageRequest(senderId: string, receiverId: string, text: string, senderNovaName: string) {
    const existingSnapshot = await getDocs(query(
      collection(db, 'conversations'),
      where('participantIds', 'array-contains', senderId),
    ))
    const pairConversations = existingSnapshot.docs.filter((item) => {
      const conversation = item.data() as Conversation
      return conversation.type === 'dm'
        && conversation.participantIds.includes(receiverId)
    })

    const pendingRequest = pairConversations.find((item) => {
      const conversation = item.data() as Conversation
      return conversation.messageRequestStatus === 'pending'
        && conversation.messageRequestFrom === senderId
        && conversation.messageRequestTo === receiverId
    })
    if (pendingRequest) {
      return {
        conversationId: pendingRequest.id,
        status: 'pending' as const,
      }
    }

    const acceptedConversation = pairConversations.find((item) => {
      const conversation = item.data() as Conversation
      return conversation.messageRequestStatus === 'accepted'
    })
    if (acceptedConversation) {
      await this.sendMessage(acceptedConversation.id, senderId, text, 'text', senderNovaName)
      return { conversationId: acceptedConversation.id, status: 'accepted' as const }
    }

    const legacyConversation = pairConversations.find((item) => {
      const conversation = item.data() as Conversation
      return !conversation.messageRequestStatus
    })
    const conversationRef = legacyConversation?.ref ?? doc(collection(db, 'conversations'))
    const messageRef = doc(collection(db, `conversations/${conversationRef.id}/messages`))
    const notificationRef = doc(collection(db, 'notifications'))
    const firstMessage = text.trim()
    const batch = writeBatch(db)
    const conversationData = {
      id: conversationRef.id,
      type: 'dm',
      messageRequestStatus: 'pending',
      messageRequestFrom: senderId,
      messageRequestTo: receiverId,
      createdBy: senderId,
      name: null,
      avatarUrl: null,
      participantIds: [senderId, receiverId],
      lastMessage: {
        messageId: messageRef.id,
        senderId,
        previewText: firstMessage,
        timestamp: serverTimestamp(),
      },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }
    if (legacyConversation) batch.update(conversationRef, conversationData)
    else batch.set(conversationRef, conversationData)
    batch.set(messageRef, {
      id: messageRef.id,
      senderId,
      senderNovaName: senderNovaName || 'NovaTalk member',
      ciphertext: firstMessage,
      messageType: 'text',
      replyTo: null,
      editedAt: null,
      deletedForEveryone: false,
      pinned: false,
      highlighted: false,
      disappearingTimer: null,
      createdAt: serverTimestamp(),
    })
    batch.set(notificationRef, {
      userId: receiverId,
      type: 'message',
      message: `${senderNovaName || 'A NovaTalk member'} sent you a message request.`,
      read: false,
      link: '/friend-requests',
      createdAt: serverTimestamp(),
    })
    await batch.commit()
    return { conversationId: conversationRef.id, status: 'pending' as const }
  },

  listenToMessageRequests(userId: string, callback: (requests: Conversation[]) => void, onError?: (error: Error) => void) {
    return onSnapshot(query(
      collection(db, 'conversations'),
      where('participantIds', 'array-contains', userId),
    ), (snapshot) => {
      callback(snapshot.docs
        .map((item) => ({ id: item.id, ...(item.data() as Omit<Conversation, 'id'>) }))
        .filter((conversation) => conversation.type === 'dm'
          && conversation.messageRequestStatus === 'pending'
          && conversation.messageRequestTo === userId))
    }, (error) => {
      onError?.(error)
    })
  },

  async acceptMessageRequest(conversationId: string, userId: string) {
    const conversationRef = doc(db, 'conversations', conversationId)
    const snapshot = await getDoc(conversationRef)
    if (!snapshot.exists()) throw new Error('This message request no longer exists.')
    const conversation = snapshot.data() as Conversation
    if (conversation.messageRequestTo !== userId || conversation.messageRequestStatus !== 'pending') {
      throw new Error('This message request can no longer be accepted.')
    }
    await updateDoc(conversationRef, { messageRequestStatus: 'accepted', updatedAt: serverTimestamp() })
  },

  async declineMessageRequest(conversationId: string, userId: string) {
    const conversationRef = doc(db, 'conversations', conversationId)
    const snapshot = await getDoc(conversationRef)
    if (!snapshot.exists()) return
    const conversation = snapshot.data() as Conversation
    if (conversation.messageRequestTo !== userId || conversation.messageRequestStatus !== 'pending') {
      throw new Error('This message request can no longer be declined.')
    }
    await updateDoc(conversationRef, { messageRequestStatus: 'declined', updatedAt: serverTimestamp() })
  },

  /**
   * Sends a message to a conversation
   */
  async sendMessage(convId: string, senderId: string, ciphertext: string, type: Message['messageType'] = 'text', senderNovaName?: string) {
    const msgRef = doc(collection(db, `conversations/${convId}/messages`))
    
    const msgData: Message = {
      id: msgRef.id,
      senderId,
      senderNovaName: senderNovaName || 'NovaTalk member',
      ciphertext,
      messageType: type,
      replyTo: null,
      editedAt: null,
      deletedForEveryone: false,
      pinned: false,
      highlighted: false,
      disappearingTimer: null,
      createdAt: serverTimestamp() as Timestamp
    }
    
    await setDoc(msgRef, msgData)

    await updateDoc(doc(db, 'conversations', convId), {
      lastMessage: {
        messageId: msgRef.id,
        senderId,
        previewText: ciphertext,
        timestamp: serverTimestamp(),
      },
      updatedAt: serverTimestamp(),
    })
    
    // Note: A Cloud Function should ideally update the `conversations` document's `lastMessage`
    // to avoid the client needing permission to write to the main conversation document.
    
    return msgRef.id
  },

  async editMessage(convId: string, messageId: string, ciphertext: string) {
    await updateDoc(doc(db, `conversations/${convId}/messages`, messageId), {
      ciphertext: ciphertext.trim(),
      editedAt: serverTimestamp(),
    })
  },

  async deleteMessage(convId: string, messageId: string) {
    await updateDoc(doc(db, `conversations/${convId}/messages`, messageId), {
      ciphertext: 'This message was deleted',
      deletedForEveryone: true,
      editedAt: serverTimestamp(),
    })
  },

  async toggleMessageFlag(convId: string, messageId: string, flag: 'pinned' | 'highlighted', value: boolean) {
    await updateDoc(doc(db, `conversations/${convId}/messages`, messageId), { [flag]: value })
  },

  listenToMessages(
    convId: string,
    callback: (items: { id: string; senderId: string; senderNovaName: string; text: string; createdAt: number }[]) => void,
    onError?: (error: Error) => void,
  ) {
    return onSnapshot(query(
      collection(db, `conversations/${convId}/messages`),
      orderBy('createdAt', 'asc'),
    ), (snap) => {
      callback(snap.docs.map((messageDoc) => {
        const message = messageDoc.data() as Pick<Message, 'senderId' | 'senderNovaName' | 'ciphertext' | 'createdAt' | 'editedAt' | 'deletedForEveryone' | 'pinned' | 'highlighted'>
        return { id: messageDoc.id, senderId: message.senderId, senderNovaName: message.senderNovaName || 'NovaTalk member', text: message.ciphertext, createdAt: message.createdAt?.toMillis?.() ?? 0, edited: Boolean(message.editedAt), deleted: Boolean(message.deletedForEveryone), pinned: Boolean(message.pinned), highlighted: Boolean(message.highlighted) }
      }))
    }, (error) => {
      onError?.(error)
    })
  },

  listenToParticipantRead(convId: string, userId: string, callback: (lastReadAt: number) => void, onError?: (error: Error) => void) {
    return onSnapshot(doc(db, `conversations/${convId}/participants`, userId), (snapshot) => {
      const data = snapshot.data() as { lastReadTimestamp?: Timestamp } | undefined
      callback(data?.lastReadTimestamp?.toMillis?.() ?? 0)
    }, (error) => {
      onError?.(error)
    })
  },

  async markConversationRead(convId: string, userId: string) {
    await setDoc(doc(db, `conversations/${convId}/participants`, userId), {
      lastReadMessageId: null,
      lastReadTimestamp: serverTimestamp(),
    }, { merge: true })
  },
}
