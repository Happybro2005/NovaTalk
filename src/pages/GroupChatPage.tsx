import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Flag, Send, Shield, UserMinus, UserPlus, Users } from 'lucide-react'
import { doc, getDoc, onSnapshot, updateDoc } from 'firebase/firestore'
import AppShell from '../components/AppShell'
import { Button, GlassCard, Input, Eyebrow } from '../components/ui'
import { useAuth } from '../contexts/AuthContext'
import { chatService } from '../services/chatService'
import { friendService } from '../services/friendService'
import { studyGroupService } from '../services/studyGroupService'
import { userService } from '../services/userService'
import { db } from '../firebase'
import type { Group, User } from '../types/models'

type ChatMessage = { id: string; senderId: string; senderNovaName: string; text: string; createdAt: number; edited?: boolean; deleted?: boolean; pinned?: boolean; highlighted?: boolean }

export default function GroupChatPage() {
  const { groupId } = useParams()
  const { currentUser } = useAuth()
  const [group, setGroup] = useState<Group | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [showInfo, setShowInfo] = useState(false)
  const [members, setMembers] = useState<User[]>([])
  const [friends, setFriends] = useState<User[]>([])
  const [friendSearch, setFriendSearch] = useState('')
  const [currentNovaName, setCurrentNovaName] = useState('NovaTalk member')
  const [messageMenu, setMessageMenu] = useState<{ id: string; x: number; y: number } | null>(null)
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
  const [descriptionDraft, setDescriptionDraft] = useState('')
  const [editingDescription, setEditingDescription] = useState(false)
  const [savingDescription, setSavingDescription] = useState(false)
  const [readReceiptsEnabled, setReadReceiptsEnabled] = useState<boolean | null>(null)
  const [participantReadTimes, setParticipantReadTimes] = useState<Record<string, number>>({})
  const lastReadMessageId = useRef<string | null>(null)

  useEffect(() => {
    if (!currentUser) return
    return onSnapshot(doc(db, 'users', currentUser.uid, 'settings', 'default'), (snapshot) => {
      const settings = snapshot.data() as { privacy?: { readReceipts?: boolean } } | undefined
      setReadReceiptsEnabled(settings?.privacy?.readReceipts !== false)
    }, () => setReadReceiptsEnabled(false))
  }, [currentUser?.uid])

  useEffect(() => {
    if (currentUser) {
      void userService.getUserProfile(currentUser.uid).then((profile) => {
        setCurrentNovaName(profile?.novaName && profile.novaName !== profile.username ? profile.novaName : 'NovaTalk member')
      })
    }
  }, [currentUser])

  useEffect(() => {
    if (!groupId) return
    void getDoc(doc(db, 'groups', groupId)).then(async (snapshot) => {
      if (!snapshot.exists()) {
        setError('This group no longer exists.')
        return
      }
      const loadedGroup = { id: snapshot.id, ...(snapshot.data() as Omit<Group, 'id'>) }
      if (!loadedGroup.conversationId && currentUser && loadedGroup.adminIds?.includes(currentUser.uid)) {
        const conversationId = await chatService.createGroupChat(currentUser.uid, loadedGroup.name, loadedGroup.id)
        await updateDoc(doc(db, 'groups', loadedGroup.id), { conversationId })
        loadedGroup.conversationId = conversationId
      }
      setGroup(loadedGroup)
    }).catch(() => setError('Unable to load this group.'))
  }, [groupId, currentUser])

  useEffect(() => {
    if (!group?.conversationId || !currentUser || readReceiptsEnabled === null) return
    lastReadMessageId.current = null
    return chatService.listenToMessages(group.conversationId, (items) => {
      const latestIncoming = [...items].reverse().find((item) => item.senderId !== currentUser.uid)
      if (readReceiptsEnabled && latestIncoming && lastReadMessageId.current !== latestIncoming.id) {
        lastReadMessageId.current = latestIncoming.id
        void chatService.markConversationRead(group.conversationId, currentUser.uid).catch((readError: unknown) => {
          console.error('Unable to mark group conversation read', readError)
        })
      }
      void Promise.all(items.map(async (item) => {
        if (item.senderNovaName !== 'NovaTalk member') return item
        const profile = await userService.getUserProfile(item.senderId)
        return { ...item, senderNovaName: profile?.novaName && profile.novaName !== profile.username ? profile.novaName : 'NovaTalk member' }
      })).then(setMessages)
    }, (listenError) => {
      setError(listenError.message || 'Unable to read group messages. Publish the latest Firestore rules.')
    })
  }, [group?.conversationId, currentUser?.uid, readReceiptsEnabled])

  useEffect(() => {
    if (!group?.conversationId || !currentUser) return
    if (readReceiptsEnabled === false) {
      setParticipantReadTimes({})
      return
    }
    const otherMemberIds = group.memberIds.filter((memberId) => memberId !== currentUser.uid)
    setParticipantReadTimes({})
    const unsubscribes = otherMemberIds.map((memberId) => chatService.listenToParticipantRead(group.conversationId, memberId, (lastReadAt) => {
      setParticipantReadTimes((current) => ({ ...current, [memberId]: lastReadAt }))
    }))
    return () => unsubscribes.forEach((unsubscribe) => unsubscribe())
  }, [group?.conversationId, group?.memberIds, currentUser?.uid, readReceiptsEnabled])

  async function openInfo() {
    if (!group || !currentUser) return
    setFriendSearch('')
    setDescriptionDraft(group.description || '')
    setEditingDescription(false)
    const [memberProfiles, friendProfiles] = await Promise.all([
      Promise.all(group.memberIds.map((id) => userService.getUserProfile(id))),
      friendService.getFriends(currentUser.uid),
    ])
    setMembers(memberProfiles.filter(Boolean) as User[])
    setFriends(friendProfiles)
    setShowInfo(true)
  }

  async function inviteMember(memberId: string) {
    if (!group || !currentUser) return
    await studyGroupService.inviteFriends(group.id, group.name, currentUser.uid, [memberId])
  }

  async function saveDescription() {
    if (!group || !currentUser || !group.adminIds.includes(currentUser.uid)) return
    try {
      setSavingDescription(true)
      setError('')
      const description = descriptionDraft.trim()
      await updateDoc(doc(db, 'groups', group.id), { description })
      setGroup({ ...group, description })
      setEditingDescription(false)
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to update the group description.')
    } finally {
      setSavingDescription(false)
    }
  }

  async function manageMember(memberId: string, action: 'admin' | 'remove') {
    if (!group || !currentUser) return
    try {
      setError('')
      if (action === 'admin') await studyGroupService.updateAdmin(group.id, currentUser.uid, memberId, !group.adminIds.includes(memberId))
      else await studyGroupService.removeMember(group.id, currentUser.uid, memberId)
      const refreshed = await getDoc(doc(db, 'groups', group.id))
      if (refreshed.exists()) setGroup({ id: refreshed.id, ...(refreshed.data() as Omit<Group, 'id'>) })
    } catch (manageError) {
      setError(manageError instanceof Error ? manageError.message : 'Unable to update group members.')
    }
  }

  async function sendMessage() {
    if (!currentUser || !group?.conversationId || !message.trim()) return
    try {
      setError('')
      if (editingMessageId) {
        await chatService.editMessage(group.conversationId, editingMessageId, message)
        setEditingMessageId(null)
      } else {
        await chatService.sendMessage(group.conversationId, currentUser.uid, message.trim(), 'text', currentNovaName)
      }
      setMessage('')
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : 'Message could not be sent. Publish the latest Firestore rules and try again.')
    }
  }

  async function handleMessageAction(action: 'edit' | 'delete' | 'pinned' | 'highlighted') {
    if (!group?.conversationId || !messageMenu || !currentUser) return
    const selectedMessage = messages.find((item) => item.id === messageMenu.id)
    if (!selectedMessage) return
    try {
      setError('')
      if (action === 'edit') {
        setEditingMessageId(selectedMessage.id)
        setMessage(selectedMessage.text)
      } else if (action === 'delete') {
        if (!window.confirm('Delete this message for everyone?')) return
        await chatService.deleteMessage(group.conversationId, selectedMessage.id)
      } else {
        await chatService.toggleMessageFlag(group.conversationId, selectedMessage.id, action, !selectedMessage[action])
      }
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'Unable to update this message.')
    } finally {
      setMessageMenu(null)
    }
  }

  const outgoingMessages = messages.filter((item) => item.senderId === currentUser?.uid)
  const latestOutgoingMessage = outgoingMessages[outgoingMessages.length - 1]
  const latestReadCount = latestOutgoingMessage
    ? Object.values(participantReadTimes).filter((timestamp) => timestamp >= latestOutgoingMessage.createdAt && latestOutgoingMessage.createdAt > 0).length
    : 0

  return (
    <AppShell>
      <div className="mx-auto flex h-[calc(100dvh-11.5rem)] min-h-0 w-full max-w-4xl flex-col overflow-hidden sm:h-[calc(100dvh-10rem)]">
        <Eyebrow>GROUP CHAT</Eyebrow>
        <div className="mt-2 flex shrink-0 items-center gap-3">
          <Link to="/groups" className="text-[#CBD5E1] hover:text-white"><ArrowLeft size={18} /></Link>
          <button type="button" onClick={() => void openInfo()} className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#4F8CFF]/15 text-[#4F8CFF] hover:bg-[#4F8CFF]/25"><Users size={22} /></button>
          <button type="button" onClick={() => void openInfo()} className="text-left">
            <h1 className="text-3xl font-semibold text-white" style={{ fontFamily: 'var(--font-display)' }}>{group?.name || 'Group chat'}</h1>
            <p className="mt-1 text-[#CBD5E1]">{group?.memberCount || 0} members</p>
          </button>
        </div>

        {error && <p className="mt-5 shrink-0 text-sm text-red-300">{error}</p>}

        <GlassCard strong className="mt-6 flex min-h-0 flex-1 flex-col p-4 sm:p-6">
          <div
            data-chat-container="true"
            data-chat-id={groupId || ''}
            data-chat-name={group?.name || 'Group Chat'}
            className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain rounded-2xl border border-white/10 bg-black/20 p-4"
          >
          {messages.length === 0 ? <p className="text-sm text-[#CBD5E1]">No messages yet. Start the conversation.</p> : messages.map((item) => (
            <div key={item.id} className={`flex w-full ${item.senderId === currentUser?.uid ? 'justify-end' : 'justify-start'}`}>
              <div
                data-message-bubble="true"
                data-message-id={item.id}
                data-message-text={item.text}
                data-message-sender-id={item.senderId}
                data-message-sender-name={item.senderId === currentUser?.uid ? 'You' : item.senderNovaName}
                data-is-self={item.senderId === currentUser?.uid ? 'true' : 'false'}
                data-chat-id={groupId || ''}
                data-chat-name={group?.name || 'Group Chat'}
                onContextMenu={(event) => { event.preventDefault(); setMessageMenu({ id: item.id, x: event.clientX, y: event.clientY }) }}
                className={`relative w-fit max-w-[50%] rounded-xl p-3 text-sm text-white ${item.senderId === currentUser?.uid ? 'bg-gradient-to-r from-[#4F8CFF] to-[#7C3AED]' : 'bg-white/[0.06]'} ${item.highlighted ? 'ring-2 ring-[#F59E0B]' : ''}`}
              >
                <div className="mb-1 text-xs font-semibold text-[#93C5FD]">{item.senderId === currentUser?.uid ? 'You' : item.senderNovaName}</div>
                <div className="break-words">{item.text} {item.edited && !item.deleted && <span className="text-xs text-[#CBD5E1]">(edited)</span>}</div>
                {item.id === latestOutgoingMessage?.id && latestReadCount > 0 && <div className="mt-1 text-right text-[10px] text-[#BFDBFE]/70">Seen by {latestReadCount}</div>}
                {item.pinned && <div className="mt-2 text-[10px] font-semibold uppercase tracking-wider text-[#FCD34D]">Pinned</div>}
              </div>
            </div>
          ))}
          </div>
          <div className="mt-4 flex shrink-0 gap-3">
            <Input value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Write to the group..." onKeyDown={(event) => { if (event.key === 'Enter') void sendMessage() }} />
            {editingMessageId && <Button variant="ghost" onClick={() => { setEditingMessageId(null); setMessage('') }}>Cancel</Button>}
            <Button onClick={() => void sendMessage()}><Send size={16} /> {editingMessageId ? 'Save' : 'Send'}</Button>
          </div>
        </GlassCard>
      </div>

      {messageMenu && <div className="fixed z-[70] w-48 rounded-xl border border-white/10 bg-[#111827] p-1.5 shadow-2xl shadow-black/40" style={{ left: Math.min(messageMenu.x, window.innerWidth - 208), top: Math.min(messageMenu.y, window.innerHeight - 220) }} onMouseLeave={() => setMessageMenu(null)}>
        {(() => { const selectedMessage = messages.find((item) => item.id === messageMenu.id); if (!selectedMessage) return null; const isMine = selectedMessage.senderId === currentUser?.uid; return <>
          {isMine && !selectedMessage.deleted && <button type="button" onClick={() => void handleMessageAction('edit')} className="block w-full rounded-lg px-3 py-2 text-left text-sm text-[#E2E8F0] hover:bg-white/10">Edit</button>}
          {isMine && !selectedMessage.deleted && <button type="button" onClick={() => void handleMessageAction('delete')} className="block w-full rounded-lg px-3 py-2 text-left text-sm text-[#FCA5A5] hover:bg-white/10">Delete</button>}
          <button type="button" onClick={() => void handleMessageAction('pinned')} className="block w-full rounded-lg px-3 py-2 text-left text-sm text-[#E2E8F0] hover:bg-white/10">{selectedMessage.pinned ? 'Unpin' : 'Pin'}</button>
          <button type="button" onClick={() => void handleMessageAction('highlighted')} className="block w-full rounded-lg px-3 py-2 text-left text-sm text-[#E2E8F0] hover:bg-white/10">{selectedMessage.highlighted ? 'Remove highlight' : 'Highlight'}</button>
          {!isMine && (
            <>
              <div className="my-1 border-t border-white/10" />
              <button
                type="button"
                onClick={() => {
                  setMessageMenu(null)
                  window.dispatchEvent(
                    new CustomEvent('novatalk:open-report', {
                      detail: {
                        type: 'message',
                        targetId: selectedMessage.id,
                        text: selectedMessage.text,
                        senderName: selectedMessage.senderNovaName,
                        chatName: group?.name || 'Group Chat',
                      },
                    })
                  )
                }}
                className="flex items-center gap-2 w-full rounded-lg px-3 py-2 text-left text-sm text-red-400 hover:bg-red-500/10"
              >
                <Flag size={14} /> Report Message
              </button>
            </>
          )}
        </> })()}
      </div>}

      {showInfo && group && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <GlassCard strong className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden p-6">
            <div className="flex shrink-0 items-center justify-between"><div><h2 className="text-xl font-semibold text-white">{group.name}</h2><p className="text-sm text-[#CBD5E1]">Group profile</p></div><Button variant="ghost" onClick={() => setShowInfo(false)}>Close</Button></div>
            <div className="mt-5 min-h-0 flex-1 overflow-y-auto pr-1">
              <div className="rounded-xl bg-white/[0.05] p-3"><div className="flex items-center justify-between gap-3"><h3 className="text-sm font-semibold text-white">Description</h3>{group.adminIds.includes(currentUser?.uid || '') && !editingDescription && <Button size="sm" variant="ghost" onClick={() => setEditingDescription(true)}>Edit</Button>}</div>{editingDescription ? <><textarea value={descriptionDraft} onChange={(event) => setDescriptionDraft(event.target.value)} rows={3} className="mt-3 w-full resize-none rounded-xl border border-white/10 bg-white/[0.05] px-3.5 py-2.5 text-sm text-white outline-none focus:border-[#4F8CFF]/60 focus:ring-2 focus:ring-[#4F8CFF]/20" placeholder="Describe this group" /><div className="mt-3 flex justify-end gap-2"><Button size="sm" variant="ghost" onClick={() => { setDescriptionDraft(group.description || ''); setEditingDescription(false) }}>Cancel</Button><Button size="sm" disabled={savingDescription} onClick={() => void saveDescription()}>{savingDescription ? 'Saving...' : 'Save'}</Button></div></> : <p className="mt-2 text-sm text-[#CBD5E1]">{group.description || 'No group description yet.'}</p>}</div>
              <h3 className="text-sm font-semibold text-white">Members ({group.memberCount})</h3>
              <div className="mt-3 space-y-2">{members.map((member) => { const isCreator = member.uid === group.createdBy; const isAdmin = group.adminIds.includes(member.uid); const canManageAdmins = currentUser?.uid === group.createdBy; const canRemove = group.adminIds.includes(currentUser?.uid || '') && !isCreator && !isAdmin; const memberNovaName = member.novaName && member.novaName !== member.username ? member.novaName : 'NovaTalk member'; return <div key={member.uid} className="flex items-center gap-3 rounded-xl bg-white/[0.05] p-3"><div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#4F8CFF]/20 text-white">{member.displayName?.[0]?.toUpperCase() || '?'}</div><div className="min-w-0 flex-1"><p className="truncate text-sm text-white">{member.displayName}</p><p className="truncate text-xs text-[#CBD5E1]">NovaName: {memberNovaName}</p></div>{isAdmin && <Shield size={16} className="text-[#4F8CFF]" />}{canManageAdmins && !isCreator && <Button size="sm" variant="ghost" aria-label={isAdmin ? `Remove admin rights from ${member.displayName}` : `Make ${member.displayName} an admin`} onClick={() => void manageMember(member.uid, 'admin')}><Shield size={14} /></Button>}{canRemove && <Button size="sm" variant="ghost" aria-label={`Remove ${member.displayName} from the group`} onClick={() => void manageMember(member.uid, 'remove')}><UserMinus size={14} /></Button>}</div> })}</div>
              {group.adminIds.includes(currentUser?.uid || '') && <div className="mt-6 border-t border-white/10 pt-4"><h3 className="text-sm font-semibold text-white">Add Friends</h3><Input className="mt-3" value={friendSearch} onChange={(event) => setFriendSearch(event.target.value)} placeholder="Search your friends..." /><div className="mt-3 space-y-2">{friends.filter((friend) => !group.memberIds.includes(friend.uid) && `${friend.displayName} ${friend.username}`.toLowerCase().includes(friendSearch.trim().toLowerCase())).map((friend) => <div key={friend.uid} className="flex items-center justify-between rounded-xl bg-white/[0.04] p-3"><span className="truncate pr-3 text-sm text-white">{friend.displayName}</span><Button size="sm" variant="secondary" onClick={() => void inviteMember(friend.uid)}><UserPlus size={14} /> Add</Button></div>)}</div></div>}
            </div>
          </GlassCard>
        </div>
      )}
    </AppShell>
  )
}
