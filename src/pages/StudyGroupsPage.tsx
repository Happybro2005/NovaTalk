import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { PlusCircle, Search, Shield, UserMinus, UserPlus, Users } from 'lucide-react'
import { doc, getDoc } from 'firebase/firestore'
import AppShell from '../components/AppShell'
import { Badge, Button, GlassCard, Eyebrow, Input } from '../components/ui'
import { useAuth } from '../contexts/AuthContext'
import { db } from '../firebase'
import { studyGroupService } from '../services/studyGroupService'
import { userService } from '../services/userService'
import { friendService } from '../services/friendService'
import type { Group, GroupRequest, User } from '../types/models'

const topics = ['Technology', 'Gaming', 'Music', 'Design', 'Sports', 'Books', 'Travel', 'Photography', 'Other']

export default function StudyGroupsPage() {
  const { currentUser } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [groups, setGroups] = useState<Group[]>([])
  const [unreadGroupIds, setUnreadGroupIds] = useState<Set<string>>(() => new Set())
  const [groupLastMessages, setGroupLastMessages] = useState<Record<string, string>>({})
  const [search, setSearch] = useState(() => (location.state as { search?: string } | null)?.search ?? '')
  const [showForm, setShowForm] = useState(false)
  const [selected, setSelected] = useState<Group | null>(null)
  const [members, setMembers] = useState<User[]>([])
  const [activity, setActivity] = useState<GroupRequest[]>([])
  const [activityProfiles, setActivityProfiles] = useState<Record<string, User | null>>({})
  const [name, setName] = useState('')
  const [topic, setTopic] = useState(topics[0])
  const [customTopic, setCustomTopic] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState('')
  const [friends, setFriends] = useState<User[]>([])
  const [invitedFriendIds, setInvitedFriendIds] = useState<string[]>([])
  const [invitingFriendId, setInvitingFriendId] = useState<string | null>(null)

  useEffect(() => {
    const initialSearch = (location.state as { search?: string } | null)?.search
    if (initialSearch) setSearch(initialSearch)
  }, [location.state])

  async function loadGroups() {
    setGroups(await studyGroupService.getGroups(search))
  }

  useEffect(() => { void loadGroups() }, [search])

  useEffect(() => {
    if (!currentUser || groups.length === 0) {
      setUnreadGroupIds(new Set())
      setGroupLastMessages({})
      return
    }
    let active = true
    void Promise.all(groups.map(async (group) => {
      if (!group.conversationId || !group.memberIds.includes(currentUser.uid)) {
        return { groupId: group.id, unread: false, preview: group.conversationId ? 'Join this group to see messages.' : 'No messages yet.' }
      }
      const conversationSnapshot = await getDoc(doc(db, 'conversations', group.conversationId))
      const conversation = conversationSnapshot.data() as { lastMessage?: { senderId?: string; previewText?: string; timestamp?: { toMillis?: () => number } } } | undefined
      const lastMessage = conversation?.lastMessage
      const preview = lastMessage?.previewText?.trim() || 'No messages yet.'
      if (!lastMessage || lastMessage.senderId === currentUser.uid) return { groupId: group.id, unread: false, preview }
      const participantSnapshot = await getDoc(doc(db, 'conversations', group.conversationId, 'participants', currentUser.uid))
      const participant = participantSnapshot.data() as { lastReadTimestamp?: { toMillis?: () => number } } | undefined
      const lastMessageAt = lastMessage.timestamp?.toMillis?.() ?? 0
      const lastReadAt = participant?.lastReadTimestamp?.toMillis?.() ?? 0
      return { groupId: group.id, unread: lastMessageAt > lastReadAt, preview }
    })).then((statuses) => {
      if (!active) return
      setUnreadGroupIds(new Set(statuses.filter((status) => status.unread).map((status) => status.groupId)))
      setGroupLastMessages(Object.fromEntries(statuses.map((status) => [status.groupId, status.preview])))
    }).catch((loadError: unknown) => {
      console.error('Unable to load unread group state', loadError)
      if (active) {
        setUnreadGroupIds(new Set())
        setGroupLastMessages({})
      }
    })
    return () => { active = false }
  }, [currentUser?.uid, groups])

  useEffect(() => {
    if (currentUser) void friendService.getFriends(currentUser.uid).then(setFriends).catch(() => setFriends([]))
  }, [currentUser])

  async function createGroup() {
    if (!currentUser || !name.trim() || (topic === 'Other' && !customTopic.trim())) return
    const groupId = await studyGroupService.createGroup({ name: name.trim(), topic: topic === 'Other' ? customTopic.trim() : topic, description: description.trim(), creatorId: currentUser.uid })
    await studyGroupService.inviteFriends(groupId, name.trim(), currentUser.uid, invitedFriendIds)
    setName('')
    setTopic(topics[0])
    setCustomTopic('')
    setDescription('')
    setShowForm(false)
    setInvitedFriendIds([])
    await loadGroups()
  }

  async function loadGroupActivity(groupId: string, senderId: string) {
    const requests = await studyGroupService.getGroupActivity(groupId, senderId)
    setActivity(requests)
    const userIds = [...new Set(requests.flatMap((request) => [request.senderId, request.receiverId]))]
    const profiles = await Promise.all(userIds.map(async (userId) => [userId, await userService.getUserProfile(userId)] as const))
    setActivityProfiles(Object.fromEntries(profiles))
  }

  async function openGroup(group: Group) {
    setSelected(group)
    const [profiles] = await Promise.all([
      Promise.all(group.memberIds.map((id) => userService.getUserProfile(id))),
      loadGroupActivity(group.id, currentUser?.uid ?? group.createdBy),
    ])
    setMembers(profiles.filter(Boolean) as User[])
  }

  async function manageMember(memberId: string, action: 'admin' | 'remove') {
    if (!currentUser || !selected) return
    try {
      setError('')
      if (action === 'admin') await studyGroupService.updateAdmin(selected.id, currentUser.uid, memberId, !selected.adminIds.includes(memberId))
      else await studyGroupService.removeMember(selected.id, currentUser.uid, memberId)
      const refreshed = (await studyGroupService.getGroups(search)).find((group) => group.id === selected.id)
      if (refreshed) await openGroup(refreshed)
      setGroups(await studyGroupService.getGroups(search))
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'Unable to update group members.')
    }
  }

  async function inviteMember(memberId: string) {
    if (!currentUser || !selected) return
    try {
      setInvitingFriendId(memberId)
      setError('')
      await studyGroupService.inviteFriends(selected.id, selected.name, currentUser.uid, [memberId])
      await loadGroupActivity(selected.id, currentUser.uid)
    } catch (inviteError) {
      setError(inviteError instanceof Error ? inviteError.message : 'Unable to invite this member.')
    } finally {
      setInvitingFriendId(null)
    }
  }

  return (
    <AppShell>
      <Eyebrow>GROUPS</Eyebrow>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
        <div><h1 className="text-3xl font-semibold text-white" style={{ fontFamily: 'var(--font-display)' }}>Find your groups</h1><p className="mt-1 text-[#CBD5E1]">Join conversations around shared interests.</p></div>
        <Button onClick={() => setShowForm((value) => !value)}><PlusCircle size={16} /> Create group</Button>
      </div>

      <div className="relative mt-6 max-w-xl"><Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#CBD5E1]/60" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search groups by name or topic" className="w-full rounded-xl border border-white/10 bg-white/[0.05] py-3 pl-10 pr-4 text-sm text-white outline-none" /></div>

      {showForm && <GlassCard className="mt-6 max-w-2xl p-5">
        <h2 className="font-semibold text-white">Create a group</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <Input label="Group name" value={name} onChange={(event) => setName(event.target.value)} />
          <div>
            <label className="mb-1.5 block text-xs font-medium text-[#CBD5E1]">Topic</label>
            <select value={topic} onChange={(event) => setTopic(event.target.value)} className="theme-select w-full rounded-xl border border-white/10 bg-white/[0.05] px-3.5 py-2.5 text-sm text-white">
              {topics.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
            {topic === 'Other' && <Input className="mt-3" label="Custom topic" value={customTopic} onChange={(event) => setCustomTopic(event.target.value)} placeholder="Type a topic" />}
          </div>
          <Input label="Description" value={description} onChange={(event) => setDescription(event.target.value)} />
        </div>
        <div className="mt-4">
          <p className="mb-2 text-sm font-medium text-[#CBD5E1]">Invite friends</p>
          <div className="max-h-40 space-y-2 overflow-y-auto">
            {friends.length === 0 ? <p className="text-sm text-[#CBD5E1]">Add friends first to invite them.</p> : friends.map((friend) => <label key={friend.uid} className="flex items-center gap-3 rounded-xl bg-white/[0.04] p-2 text-sm text-white">
              <input type="checkbox" checked={invitedFriendIds.includes(friend.uid)} onChange={() => setInvitedFriendIds((ids) => ids.includes(friend.uid) ? ids.filter((id) => id !== friend.uid) : [...ids, friend.uid])} />
              {friend.novaName} <span className="text-xs text-[#CBD5E1]">@{friend.username}</span>
            </label>)}
          </div>
        </div>
        <Button className="mt-4" disabled={topic === 'Other' && !customTopic.trim()} onClick={() => void createGroup()}>Create group</Button>
      </GlassCard>}

      {error && <p className="mt-5 text-sm text-red-300">{error}</p>}
      <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {groups.length === 0 ? <GlassCard className="col-span-full p-8 text-center text-[#CBD5E1]">No groups found.</GlassCard> : groups.map((group) => {
          const isMember = Boolean(currentUser && group.memberIds.includes(currentUser.uid))
          const hasUnread = unreadGroupIds.has(group.id)
          return <div key={group.id} role={isMember ? 'button' : undefined} tabIndex={isMember ? 0 : undefined} onClick={() => { if (isMember) navigate(`/groups/${group.id}/chat`) }} onKeyDown={(event) => { if (isMember && (event.key === 'Enter' || event.key === ' ')) navigate(`/groups/${group.id}/chat`) }} className={isMember ? 'cursor-pointer' : undefined}>
            <GlassCard className={`p-5 transition-shadow ${hasUnread ? 'bg-[#4F8CFF]/[0.08] ring-1 ring-[#4F8CFF]/70 shadow-[0_0_18px_rgba(79,140,255,0.22)]' : isMember ? 'hover:shadow-lg hover:shadow-[#4F8CFF]/10' : ''}`}>
              <div className="flex items-start gap-4">
                <button type="button" aria-label={`Open ${group.name} details`} onClick={(event) => { event.stopPropagation(); void openGroup(group) }} className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#4F8CFF]/15 text-[#4F8CFF] hover:bg-[#4F8CFF]/25"><Users size={22} /></button>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3"><h2 className="truncate font-semibold text-white">{group.name}</h2>{hasUnread && <span aria-label="Unread group messages" className="h-2.5 w-2.5 shrink-0 rounded-full bg-[#4F8CFF] shadow-[0_0_10px_rgba(79,140,255,0.8)]" />}</div>
                  <p className="mt-1 truncate text-sm text-[#CBD5E1]">{groupLastMessages[group.id] || (isMember ? 'No messages yet.' : 'Join this group to see messages.')}</p>
                </div>
              </div>
            </GlassCard>
          </div>
        })}
      </div>

      {selected && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
        <GlassCard strong className="max-h-[90vh] w-full max-w-lg overflow-y-auto p-6">
          <div className="flex items-center justify-between">
            <div><h2 className="text-xl font-semibold text-white">{selected.name}</h2><p className="text-sm text-[#CBD5E1]">Group info and member controls</p></div>
            <Button variant="ghost" onClick={() => setSelected(null)}>Close</Button>
          </div>
          <div className="mt-5 space-y-3">
            {members.map((member) => {
              const isCreator = member.uid === selected.createdBy
              const isAdmin = selected.adminIds.includes(member.uid)
              const canManageAdmins = currentUser?.uid === selected.createdBy
              const canRemove = Boolean(currentUser && selected.adminIds.includes(currentUser.uid) && !isCreator && !isAdmin)
              const memberName = member.novaName || 'NovaTalk member'
              return <div key={member.uid} className="flex items-center gap-3 rounded-xl bg-white/[0.05] p-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#4F8CFF]/20 text-white">{memberName[0]?.toUpperCase() || '?'}</div>
                <div className="min-w-0 flex-1"><p className="truncate text-sm text-white">{memberName}</p><p className="truncate text-xs text-[#CBD5E1]">@{member.username}</p></div>
                {isAdmin && <Badge tone="primary"><Shield size={13} /> Admin</Badge>}
                {canManageAdmins && !isCreator && <Button size="sm" variant="ghost" aria-label={`Change admin status for ${memberName}`} onClick={() => void manageMember(member.uid, 'admin')}><Shield size={14} /></Button>}
                {canRemove && <Button size="sm" variant="ghost" aria-label={`Remove ${memberName} from group`} onClick={() => void manageMember(member.uid, 'remove')}><UserMinus size={14} /></Button>}
              </div>
            })}
          </div>
          {currentUser && selected.adminIds.includes(currentUser.uid) && <div className="mt-6 border-t border-white/10 pt-4">
            <h3 className="text-sm font-semibold text-white">Add Friends</h3>
            <div className="mt-3 space-y-2">
              {friends.filter((friend) => !selected.memberIds.includes(friend.uid)).map((friend) => {
                const inviteStatus = activity.find((request) => request.receiverId === friend.uid)?.status
                const blocked = inviteStatus === 'pending' || inviteStatus === 'accepted' || invitingFriendId === friend.uid
                const buttonText = invitingFriendId === friend.uid ? 'Sending...' : inviteStatus === 'pending' ? 'Requested' : inviteStatus === 'accepted' ? 'Accepted' : inviteStatus === 'rejected' ? 'Resend' : 'Add'
                return <div key={friend.uid} className="flex items-center justify-between rounded-xl bg-white/[0.04] p-3">
                  <span className="min-w-0 truncate pr-3 text-sm text-white">{friend.novaName || 'NovaTalk member'} <span className="text-xs text-[#CBD5E1]">@{friend.username}</span></span>
                  <Button size="sm" variant="secondary" disabled={blocked} onClick={() => void inviteMember(friend.uid)}><UserPlus size={14} /> {buttonText}</Button>
                </div>
              })}
            </div>
          </div>}
          <div className="mt-6 border-t border-white/10 pt-4">
            <h3 className="text-sm font-semibold text-white">Member activity</h3>
            <div className="mt-3 space-y-2">
              {activity.length === 0 ? <p className="text-sm text-[#CBD5E1]">No invitations yet.</p> : activity.map((request) => {
                const recipient = activityProfiles[request.receiverId]
                return <div key={request.id} className="flex items-center justify-between gap-3 rounded-xl bg-white/[0.04] p-3 text-sm">
                  <div className="min-w-0"><p className="truncate text-white">{recipient?.novaName || 'NovaTalk member'}</p><p className="truncate text-xs text-[#CBD5E1]">@{recipient?.username || 'username unavailable'}</p></div>
                  <Badge tone={request.status === 'accepted' ? 'success' : request.status === 'rejected' ? 'danger' : 'warning'}>{request.status}</Badge>
                </div>
              })}
            </div>
          </div>
        </GlassCard>
      </div>}
    </AppShell>
  )
}
