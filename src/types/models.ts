import { Timestamp } from 'firebase/firestore'

export interface User {
  uid: string
  username: string
  novaName: string
  novaNameChangedAt: Timestamp
  email: string
  displayName: string
  avatarUrl: string
  bio: string
  department: string
  semester: string
  country: string
  gender: string
  dob: Timestamp | null
  language: string
  subjects: string[]
  interests: string[]
  skills: string[]
  createdAt: Timestamp
  lastSeen: Timestamp
  online: boolean
  searchingForStudyPartner: boolean
  accountStatus: 'active' | 'suspended' | 'banned' | 'deleted'
  banExpiresAt?: number | null
  banReason?: string | null
  bannedAt?: number | null
  role: 'user' | 'admin' | 'moderator'
  verificationStatus: boolean
}

export interface UserSettings {
  notifications: {
    push: boolean
    email: boolean
    mentions: boolean
  }
  privacy: {
    readReceipts: boolean
    lastSeen: 'everyone' | 'friends' | 'nobody'
    studyMatch: boolean
  }
  theme: 'light' | 'dark' | 'system'
}

export interface Conversation {
  id: string
  type: 'dm' | 'group' | 'study'
  messageRequestStatus?: 'pending' | 'accepted' | 'declined'
  messageRequestFrom?: string
  messageRequestTo?: string
  skippedBy?: string
  skipEventId?: string
  skipUntil?: number
  createdBy: string | null
  name: string | null
  avatarUrl: string | null
  lastMessage: {
    messageId: string
    senderId: string
    previewText: string
    timestamp: Timestamp
  } | null
  participantIds: string[]
  groupId?: string
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface ConversationParticipant {
  uid: string
  role: 'member' | 'admin'
  joinedAt: Timestamp
  mutedUntil: Timestamp | null
  archived: boolean
  lastReadMessageId: string | null
  lastReadTimestamp: Timestamp | null
}

export interface Message {
  id: string
  senderId: string
  senderNovaName?: string
  ciphertext: string
  messageType: 'text' | 'image' | 'voice' | 'file'
  encryptedKey?: Record<string, string>
  replyTo: string | null
  editedAt: Timestamp | null
  deletedForEveryone: boolean
  pinned?: boolean
  highlighted?: boolean
  disappearingTimer: number | null
  createdAt: Timestamp
}

export interface Friendship {
  id: string
  userIdA: string
  userIdB: string
  createdAt: Timestamp
}

export interface FriendRequest {
  id: string
  senderId: string
  receiverId: string
  status: 'pending' | 'accepted' | 'declined'
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface Community {
  id: string
  name: string
  description: string
  avatarUrl: string | null
  memberCount: number
  createdAt: Timestamp
}

export interface Notification {
  id: string
  userId: string
  type: 'friend_request' | 'friend_accepted' | 'community_join' | 'support_reply' | 'system' | 'message'
  message: string
  read: boolean
  link: string | null
  createdAt: Timestamp
}

export interface TicketReply {
  id: string
  senderId: string
  senderName: string
  senderRole: 'user' | 'admin'
  message: string
  createdAt: number
}

export interface SupportTicket {
  id: string
  userId: string
  userName?: string
  userEmail?: string
  subject: string
  message: string
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
  canUserReply?: boolean
  replies?: TicketReply[]
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface StudyGroup {
  id: string
  name: string
  subject: string
  description: string
  createdBy: string
  memberIds: string[]
  memberCount: number
  createdAt: Timestamp
}

export interface Group {
  id: string
  name: string
  description: string
  topic: string
  createdBy: string
  adminIds: string[]
  memberIds: string[]
  memberCount: number
  createdAt: Timestamp
  conversationId: string
}

export interface GroupRequest {
  id: string
  groupId: string
  groupName: string
  senderId: string
  receiverId: string
  status: 'pending' | 'accepted' | 'rejected'
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface Project {
  id: string
  title: string
  description: string
  subject: string
  createdBy: string
  memberIds: string[]
  status: 'open' | 'in_progress' | 'completed'
  requiredSkills: string[]
  createdAt: Timestamp
}

export interface StudyNote {
  id: string
  title: string
  subject: string
  description: string
  fileUrl: string
  fileName: string
  uploadedBy: string
  uploaderName: string
  createdAt: Timestamp
}

export interface MentorRequest {
  id: string
  requesterId: string
  requesterName: string
  mentorId: string | null
  subject: string
  message: string
  department: string
  semester: string
  status: 'pending' | 'accepted' | 'declined' | 'completed'
  createdAt: Timestamp
}

export interface CampusEvent {
  id: string
  title: string
  description: string
  type: 'workshop' | 'hackathon' | 'seminar' | 'activity'
  date: string
  location: string
  createdBy: string
  participantIds: string[]
  createdAt: Timestamp
}

export interface EventPost {
  id: string
  eventId: string
  authorId: string
  authorName: string
  content: string
  createdAt: Timestamp
}

export interface AcademicDoubt {
  id: string
  authorId: string
  authorName: string
  title: string
  content: string
  category: string
  nlpConfidence: number
  createdAt: Timestamp
}

export interface Report {
  id: string
  reporterId: string
  reporterName?: string
  targetType: 'user' | 'message' | 'chat' | 'post' | 'community'
  targetId: string
  reportedUserId?: string
  reportedUserName?: string
  reason: string
  status: 'pending' | 'resolved' | 'dismissed'
  actionTaken?: 'banned' | 'no_action' | 'dismissed'
  banDays?: number | null
  actionNote?: string
  resolvedAt?: Timestamp
  createdAt: Timestamp
}
