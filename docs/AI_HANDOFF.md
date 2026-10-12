# NovaTalk AI / Maintainer Handoff

## 1) Product purpose

NovaTalk is a social-first messaging app built around friend discovery, group invitations, group chats, and real-time community interactions. It is not a study-only app anymore and should not be treated as a mock/demo product.

Current product behavior:
- Users sign up with email/password and optional Google sign-in.
- Every user has a profile with a visible display name and a separate NovaName.
- NovaName is the public-facing identity shown in group chats and stranger-visible contexts.
- Users can add friends, receive requests, create or join groups, and message inside group conversations.
- Group creators can manage admin privileges and member access.
- Chat messages are stored in Firestore, with the app listening in real time for updates.
- App theme and online presence are persisted and synced through Firestore + local storage.

## 2) Living update policy

This document is a live architecture ledger, not a one-time setup note.

The rule for future work:
- After each meaningful change, update this file with the new behavior, dependencies, or constraints.
- If a feature is added or a product rule changes, record it here with the date and the reason.
- Preserve the guardrails section as the source of truth for things that must not be regressed.

Current update log:
- 2026-10-12: Document created and aligned to the live Firebase-backed social app behavior.
- 2026-10-12: Confirmed the app is friend/group/social-first, not study-only.
- 2026-10-12: Recorded the NovaName and Firestore rule constraints as product-critical behavior.
- 2026-10-12: Live app check: signup is blocked by Firestore permissions until the rules are published from Firebase Console.
- 2026-10-12: Root cause identified: the `users/{uid}` update rule was too narrow and rejected standard profile/presence writes like `online`, `lastSeen`, and profile fields, even when the user was authenticated.
- 2026-10-12: Updated the rule to permit the app’s required self-update operations while preserving NovaName cooldown enforcement.
- 2026-10-12: Friend matching no longer blocks on a completed profile; department, semester, subjects, interests, and skills are optional matching signals. `firebase.json` currently points to `firestore.rules.temp` for the demo, while `firestore.rules` remains the separate production policy file.
- 2026-10-12: Friend search and request lists display NovaName plus username. Search results retain pending requests as `Requested`; clicking that state cancels the pending request. Request and notification writes are committed atomically.
- 2026-10-12: Incoming and outgoing friend requests are live Firestore listeners on the Requests page, and request query failures are surfaced in the UI.
- 2026-10-12: Deployed the existing `friend_requests` composite indexes for `senderId` + `createdAt` and `receiverId` + `createdAt` to `novatalk-d6c58` after the Requests page reported a missing-index error.
- 2026-10-12: Because the composite-index error persisted after deployment, friend request reads now filter on one field and sort locally; friend search and duplicate-request checks also avoid compound filters.
- 2026-10-12: The Outgoing requests list shows pending requests as a `Requested` button; clicking it cancels and deletes that request, and the live listener removes it from the list.
- 2026-10-12: Dashboard identity displays use NovaName instead of `displayName` for the signed-in greeting, suggested friends, and recent one-to-one chats; suggested friends also show `@username`.
- 2026-10-12: Dashboard Suggested friends excludes users who are already connected as friends.
- 2026-10-12: The Friends-page `Message` button now opens an existing accepted direct conversation or creates one, then navigates to `/messages/:conversationId`.
- 2026-10-12: Dashboard Recent chats includes only group conversations and direct conversations with friends or explicitly accepted message requests. Stranger matches and pending/declined message requests are filtered out before selecting the five most recent entries.
- 2026-10-12: Dashboard Recent chats compares the latest message timestamp with the signed-in participant's read timestamp; unseen chats get a blue glowing edge and dot. Opening a group chat updates that participant read timestamp so the indicator clears.
- 2026-10-12: The Groups page also compares each member group's latest message with the signed-in participant read timestamp and applies the same glowing edge/dot to groups with unseen messages.
- 2026-10-12: Presence now heartbeats while the app is visible, transitions offline on hidden/page exit, and stale friend presence expires in the UI. Settings exposes Last seen visibility (`everyone`, `friends`, `nobody`), and friends/search hide presence when privacy settings deny or restrict it.
- 2026-10-12: Read receipts are controlled by the saved privacy setting in direct, group, and stranger chats. Incoming messages update read timestamps only while enabled; direct chats show `Seen`, groups show `Seen by N`.
- 2026-10-12: Friend discovery now listens to its saved setting and leaves/rejoins the queue immediately when toggled. Navigation tabs glow individually for unread Dashboard chats, friend-match chats, requests, notifications, and groups; initial notifications are not replayed as new-message popups.
- 2026-10-12: New friend/group messages now trigger an in-app toast linking to the conversation and optional browser notifications when Push is enabled and permission is granted. Pending message requests and stranger-match messages are excluded from friend-message toasts.
- 2026-10-12: Group member/invite labels use NovaName and username; Member activity resolves invitation recipients to profiles. Group invitations are deduplicated per inviter, group, and recipient: pending/accepted requests are not resent, while rejected requests can be reopened and resent.
- 2026-10-12: The shared header search now performs debounced people (NovaName/username) and group (name/topic) searches, displays selectable results, and opens the corresponding page with the selected search prefilled.
- 2026-10-12: Suggested-friend messaging creates a pending DM containing one starter message and notifies the recipient. Message requests appear in Requests with Accept/Decline; accepting opens `/messages/:conversationId` for continued chat. Any legacy DM without an explicit accepted/request status is converted to a pending request, regardless of prior messages. The sender stays on Dashboard with an animated check confirmation; explicitly accepted chats receive a direct message without redirect. `firestore.rules` remains unchanged, so server-side enforcement of the pending state is a security-hardening follow-up.
- 2026-10-12: The Requests page labels the one-time starter-message section `Msg request`; each entry shows the sender's NovaName/username and message with Accept/Decline actions.
- 2026-10-12: Direct, group, and friend-match chat messages now use left/right alignment by sender and a 50% maximum bubble width.
- 2026-10-12: Removed the explanatory “How it works” panel from the friend-matching page.
- 2026-10-12: Stranger chat includes `Add friend` (sends a normal friend request) and `Skip` (requeues and excludes the skipped person for the current page session only).
- 2026-10-12: Stranger-chat actions are placed in a current-match sidebar beside the live chat; the sidebar shows the matched user's NovaName/username or queue status while searching. Add/Skip only render for an active match.
- 2026-10-12: Skip broadcasts a shared event so both participants leave the old conversation and rejoin matchmaking. Each excludes the other for five seconds, after which the pair is eligible again; the UI only says “Finding you someone new...” rather than identifying who skipped. Active matches recheck skip state on focus and poll every two seconds while visible. Hiding the browser tab or navigating away from friend-match also ends the match for both participants.
- 2026-10-12: Updated the friend-matching tagline to “Meet someone new, share a moment, and see where the conversation goes.”

## 3) High-level architecture

The app is a React + TypeScript + Vite frontend with Firebase as the backend and persistence layer.

Key integrations:
- Firebase Auth: login, registration, logout, password reset, Google sign-in
- Cloud Firestore: users, profiles, friendships, group requests, notifications, groups, conversations, messages
- Firebase Storage: profile assets if used in future uploads
- Local storage: theme preference
- React Router: page-level navigation inside the SPA

Runtime flow:
1. User signs in via Firebase Auth.
2. `AuthContext` ensures the Firestore user profile exists.
3. UI pages call service modules like `userService`, `friendService`, `studyGroupService`, and `chatService`.
4. Services read/write Firestore collections directly.
5. Real-time listeners update the page state without a full page reload.

## 4) Source-of-truth rules

These are the critical rules for maintaining the app correctly:

- Firestore is the source of truth for user data, groups, invitations, messages, and presence.
- Firebase Auth is only for identity and session state.
- The app should not reintroduce demo/in-memory data as a primary source.
- The app is social/friend-based; old study-match language and behavior should be treated as legacy unless explicitly reintroduced.
- NovaName is intentionally separate from username and should remain distinct in the UI and DB.

## 5) Core app structure

### Routes and key screens

Main app routes:
- `/` — landing page
- `/login` — login
- `/register` — registration
- `/forgot-password` — password reset
- `/dashboard` — user dashboard
- `/friends` — friend search and friend list
- `/requests` — incoming friend/group requests
- `/groups` — groups list and creation flow
- `/groups/:groupId/chat` — group chat and group management UI
- `/profile` — profile settings and NovaName management
- `/settings` — app settings
- `/support` — support page
- `/admin` and `/admin/dashboard` — admin access and admin dashboard

Important navigation note:
- Group cards and related in-app actions should open pages in-app with React Router rather than `window.location` full reloads.
- Avoid adding full refresh navigation back into the flow unless there is a clear product reason.

## 6) Critical data model

### Users

Primary document shape:
- `users/{uid}`
- Fields include:
  - `uid`
  - `username`
  - `displayName`
  - `email`
  - `novaName`
  - `novaNameChangedAt`
  - `avatarUrl`
  - `bio`, `country`, `department`, `semester`, `language`, etc.
  - `online`, `lastSeen`, `role`, `accountStatus`

Profile rules:
- `novaName` is a separate public identity.
- `username` is not a fallback alias for `novaName`.
- `novaNameChangedAt` is used for the 2-month change cooldown.

### User settings

Settings are stored under:
- `users/{uid}/settings/default`

Typical settings include:
- theme
- notification toggles
- privacy preference

This is the theme source used by the app after login.

### Friend and request models

Collections:
- `friendships/{friendshipId}`
- `friend_requests/{requestId}`
- `notifications/{notificationId}`

Friend operations are handled through `friendService` and should remain as a symmetric friend relationship model, not a loose ad-hoc list.

### Groups and invitations

Collections:
- `groups/{groupId}`
- `group_requests/{requestId}`

`groups/{groupId}` includes:
- `name`
- `topic`
- `description`
- `createdBy`
- `adminIds`
- `memberIds`
- `memberCount`
- `conversationId`

Group invitations are stored in `group_requests` and resolved through `studyGroupService`.

### Conversations and messages

Collections:
- `conversations/{conversationId}`
- `conversations/{conversationId}/messages/{messageId}`

Each conversation tracks participants and the group link when relevant. Message documents store payloads like:
- `senderId`
- `senderNovaName`
- `ciphertext`
- `editedAt`
- `deletedForEveryone`
- `pinned`
- `highlighted`

Group chats are created when a group is created and then linked via `conversationId` on the group.

## 7) Service map

### `src/contexts/AuthContext.tsx`
This is the central auth/session integration layer.

Responsibilities:
- listens to `onAuthStateChanged`
- ensures the Firestore user profile exists
- sets presence online/offline
- syncs theme from profile settings or local storage
- rolls back newly created auth accounts if registration fails during profile creation

Do not remove the rollback logic. This prevents orphaned Firebase Auth users after failed profile writes.

### `src/services/userService.ts`
This is the identity/profile layer.

Responsibilities:
- `createUserDocument()`
- `ensureUserDocument()`
- `updateNovaName()` with cooldown enforcement
- online/offline presence updates

This is the official place for any NovaName validation or profile migration logic.

### `src/services/friendService.ts`
Friend discovery, requests, pending states, acceptance, decline, and removal logic live here.

Important: social friend matching is the real system behavior; do not route this back to study-only behavior.

### `src/services/studyGroupService.ts`
This file is the group orchestration layer.

Responsibilities:
- create groups
- invite friends to a group
- handle group requests
- update admin roles
- add/remove members
- keep `group.conversationId` and `memberIds` in sync

This file is the integration point between group membership and chat membership.

### `src/services/chatService.ts`
This is the message and conversation layer.

Responsibilities:
- create group chats
- listen for real-time message updates
- send new messages
- mark edited/deleted/pinned/highlighted messages
- support chat metadata such as sender NovaName

Do not ignore `senderNovaName` when sending messages; it is part of the public user identity contract.

## 8) How the app is connected together

### Auth -> user profile
`AuthContext` calls `userService.ensureUserDocument()` after sign-in. That creates or repairs the Firestore user record before the app loads user data.

### User profile -> UI identity
Pages such as `ProfilePage` and `GroupChatPage` read the current user profile and decide which identity to show:
- display name for internal account identity
- NovaName for stranger/public identity

### Group creation -> conversation creation
When a new group is created in `studyGroupService.createGroup()`:
1. A `groups/{groupId}` document is created.
2. A conversation is created via `chatService.createGroupChat()`.
3. The newly created `conversationId` is saved back onto the group.

This means the group and group chat are tightly coupled.

### Group membership -> chat membership
When users are accepted into a group, `respondToRequest()` updates the group membership and calls `chatService.addGroupMember()` to ensure the conversation includes the user.

### Friend request flow
Users search for friends, send request documents, and then accept or reject requests through `friendService` and notification records.

## 9) Firestore rules and deployment requirement

The Firestore rules file in the project root is part of the app’s real security model and is currently the blocker for account creation in the live app.

Important requirement:
- The rules must be published in the Firebase Console for them to become active.
- Client-side logic alone is not enough.
- Signup is failing in the current session because the `users/{uid}` create path is blocked by Firestore permissions until the latest rules are deployed.

The rules enforce:
- signed-in access requirements
- user profile self-service rules
- group admin/member rules
- group-request logic
- friend request restrictions
- participant membership checks
- NovaName cooldown enforcement

If the rules are not published, the app may appear to work locally while backend security is still effectively disabled.

## 10) What must not be changed casually

These are intentionally protected behaviors and should be treated as product contract, not optional polish:

1. NovaName separation
   - Do not fallback from `novaName` to `username` in the UI or profile logic.
   - Do not remove the `novaNameChangedAt` cooldown.

2. Social-first product model
   - Do not revert the app to a study-match or classroom-focused mindset without a deliberate product decision.
   - Friend search, requests, group invitations, and group chat are part of the core product.

3. Real Firestore integration
   - Do not reintroduce mock arrays or in-memory state as a primary backend source.
   - If data is changed, update the Firestore logic and the corresponding rules.

4. Group chat coupling
   - Do not separate group metadata from conversation creation without updating the behavior in both `studyGroupService` and `chatService`.

5. Theme + presence behavior
   - Do not remove the local theme persistence or the online/offline lifecycle logic.

6. App navigation style
   - Do not replace in-app navigation with full page reloads for normal app flows.

7. Security-policy assumptions
   - Do not treat backend rules as optional or as a future step if the app is used with real Firebase data.

## 11) Customizations already applied in this codebase

These are important to preserve when working on the project:

- The app was converted from a demo/study theme into a social/friend-focused product.
- Group pages now have card-based navigation and in-app transitions instead of full page reloads.
- Group chats use their own conversation documents and real-time message listeners.
- Group creators and admins manage roles separately from member CRUD.
- NovaName is stored and validated distinctly from username.
- Signup includes rollback logic to delete an auth user if Firestore creation fails.
- Theme is initialized before first render to prevent flash and then synced from saved user settings.
- Right-click and app-specific UI behavior were added to support a custom branded experience without breaking standard browser behavior.

## 12) Recommended change workflow for future AI or contributors

When making a change:
1. Identify the service layer first.
2. Check the corresponding Firestore collection and rules.
3. Confirm whether the UI expects a public identity, profile field, or group/chat relationship.
4. Preserve the existing social/friend/group contract instead of reverting to legacy study app concepts.
5. Validate by running the project build and checking the relevant data flow.

## 13) Quick validation checklist

Before shipping a change, check:
- Firebase Auth flow still works
- `users/{uid}` is created or repaired correctly
- the Firestore rules file has been published in Firebase Console before testing signup or profile writes
- `novaName` and cooldown logic still match the rules
- groups create a conversation and keep `conversationId` in sync
- group admin/member actions still respect the rules
- friend requests and notifications still operate properly
- app navigation remains in-app and not reload-based

## 14) Summary

The app is a Firebase-backed social networking and real-time group chat product. The most important architecture guardrails are:
- separate public identity from account identity (`novaName` vs username)
- Firestore as the real source of truth
- group and conversation coordination through service modules
- security rules as enforced backend policy
- social-first behavior rather than original study/demo assumptions

If future AI or maintainers change features, they should think in terms of service-layer integration and Firestore contract enforcement, not just page-level UI changes.
