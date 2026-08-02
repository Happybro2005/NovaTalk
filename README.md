# NovaTalk

A production-ready, real-time social communication platform featuring anonymous stranger chat, friend networking, communities, live messaging, and a Firebase-powered admin control center — all built on React + Vite and Firebase.

This repository currently contains the **Frontend (Design Pass 1)**: a cosmic-themed frontend built with React + TypeScript + Tailwind v4 + Framer Motion + Lucide icons + React Router. No backend/Firebase logic is integrated yet — placeholder data only.

## Run it locally

```bash
npm install
npm run dev
```

Then open the printed localhost URL.

---

## What's included in Frontend (Design Pass 1)

- `/` — Landing page (hero, live stats, feature catalog, testimonials, download CTA, footer)
- `/login` — Login (glass card, Google button, animated backdrop)
- `/register` — Registration (avatar upload UI, full profile fields, interests picker)
- `/forgot-password` — Password reset
- `/dashboard` — User dashboard (quick actions, recent chats, online friends, suggested friends, community feed, notifications) inside the app shell (sidebar + topbar + mobile bottom nav)
- `/admin` — Admin passcode gate (6-digit code, no separate admin account/login flow)
- `/admin/dashboard` — Mission Control overview (stat widgets, growth chart, recent reports, recent users table)

### Signature design element

A live "constellation field" canvas (`src/components/ConstellationField.tsx`) drifts particles that connect into faint lines when close — a literal constellation forming and dissolving. It sits behind every screen via `AmbientBackdrop.tsx`, tying the cosmic theme directly into the UI rather than using generic blurred blobs.

Feature cards on the landing page are labeled with real constellation/star names (ORION, LYRA, POLARIS, AEGIS, VEGA, CARTOGRAPHY) chosen to match what each feature does, instead of generic 01/02/03 numbering.

### Stack notes

- Tailwind v4 via `@tailwindcss/vite` — tokens live in `src/index.css` under `@theme`.
- Fonts: Space Grotesk (display), Inter (body), JetBrains Mono (eyebrows/labels) — loaded via Google Fonts in `index.html`.
- All components are plain Tailwind + custom primitives (`src/components/ui.tsx`) — no shadcn/ui, to keep the bundle light and the cosmic aesthetic tightly controlled.

---

## Overall Project Overview & Architecture

### Tech Stack

- Frontend:        React.js, Vite, HTML5, CSS3, TypeScript, Tailwind CSS, Framer Motion
- State/Logic:      React Context API, Custom Hooks
- Authentication:   Firebase Authentication (Email/Password, Google Sign-In)
- Database:         Cloud Firestore
- Real-Time Layer:  Firebase Realtime Database
- Storage:          Firebase Storage
- Security:         Firebase Security Rules, Role-Based Access Control (RBAC)
- Analytics:        Firebase Analytics
- Hosting:          Firebase Hosting or Vercel

### Architecture

```
End Users (User Portal / Admin Portal)
        |
        v
React + Vite Frontend
        |
        +--> Firebase Authentication
        +--> Cloud Firestore
        +--> Realtime Database
        +--> Firebase Storage
        +--> Firebase Analytics
        |
        v
Firebase Security Rules (Firestore / Storage / RTDB / Role Validation)
        |
        v
Firebase Cloud Services (Transactions, Batch Writes, Offline Persistence,
                          Real-time Listeners, Aggregate Queries, App Check)
```

See `/docs/NovaTalk_Architecture_and_Features.docx` for full diagrams covering:
1. High-Level Architecture
2. Component Architecture
3. Data Flow Architecture
4. Security Architecture
5. Application Flow (User Journey)

### Firestore Collections

`users/`, `admins/`, `usernames/`, `friends/`, `friendRequests/`, `blockedUsers/`, `chats/`, `messages/`, `communities/`, `posts/`, `comments/`, `reports/`, `supportTickets/`, `notifications/`, `auditLogs/`, `settings/`

### Realtime Database Structure

`status/`, `typing/`, `waitingUsers/`, `activeMatches/`, `presence/`, `voiceCalls/`

### Storage Structure

`profile-images/`, `chat-images/`, `voice-notes/`, `community-media/`, `documents/`

---

## Features

### User Features
- **Authentication & Security:** Email/Password + Google Sign-In, email verification, session restoration, protected routes, offline persistence
- **Profile:** username, display name, avatar, bio, country, gender, DOB, language, interests, online status/last seen, privacy controls
- **Stranger Chat:** anonymous matchmaking queue, instant connection, skip/end chat, typing indicators, read receipts, live presence
- **Friends:** send/accept/reject/cancel requests, remove, block/unblock, search
- **Communities:** create/join/leave, feed, posts, comments, reactions, media, moderation
- **Messaging:** real-time text, emoji, images, voice notes, files, chat history, timestamps, read/typing status
- **Calling:** voice calls, incoming call notifications, call history, mute/end
- **Notifications:** friend requests, messages, communities, reports, system, real-time alerts
- **Safety:** report/block users, privacy settings, ban/suspension detection
- **Settings:** change password/email, update profile, notification & privacy preferences, language preferences

### Admin Mission Control
- **Admin Authentication:** separate login, role verification, super admin / moderator / support staff access, protected routes
- **Live Dashboard:** total & online users, active chats, matchmaking queue, messages, communities, reports, tickets, banned/suspended users, DB & storage status
- **User Management:** view/search/filter, suspend/ban/unban, restrict matchmaking, login history
- **Reports Management:** view/approve/reject/resolve/delete, categories, reporter info, history
- **Chat & Community Moderation:** view live chats, remove messages/posts/comments, delete chats/communities, ban members
- **Announcements:** global announcements, maintenance notices, broadcasts
- **Support Center:** view/assign/resolve tickets, ticket history
- **Analytics:** DAU/MAU, user & friend growth, message volume, report trends, matchmaking stats, retention
- **Audit Logs:** admin logins, user actions, moderation, DB changes, security & auth events
- **Database Management:** Firestore/RTDB/Storage monitoring, collection stats, DB health
- **Security:** role-based permissions, Firestore/Storage/RTDB rules, secure route guards, session validation, username reservation transactions

### Roadmap / Future Enhancements
Video calling, AI-powered chat moderation, AI matchmaking recommendations, end-to-end encryption, voice & video rooms, stories/status updates, push notifications, multi-language support, QR code profile sharing, premium membership & subscriptions, verification badges, dark/light theme toggle, desktop app, Android & iOS apps, AI chat assistant, live translation, screen sharing, event-based communities, cloud backup & restore.

---

## Configuration & Deploying Backend Rules (Next Steps)

1. **Configure Firebase**
   - Create a Firebase project at https://console.firebase.google.com
   - Enable Authentication (Email/Password + Google), Firestore, Realtime Database, Storage, and Analytics
   - Copy your Firebase config into a `.env` file at the project root:
     ```env
     VITE_FIREBASE_API_KEY=your_api_key
     VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
     VITE_FIREBASE_PROJECT_ID=your_project_id
     VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
     VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
     VITE_FIREBASE_APP_ID=your_app_id
     VITE_FIREBASE_DATABASE_URL=https://your_project.firebaseio.com
     ```
2. **Deploy Firestore / RTDB / Storage security rules**
   ```bash
   firebase deploy --only firestore:rules,database,storage
   ```

---

## Security

Access is controlled through a role-detection flow: authenticated users are routed to either the User Portal or Admin Portal, each guarded by a dedicated route guard (`RequireAuth` / `RequireAdmin`), before requests reach Firestore and Realtime Database security rules.

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes (`git commit -m "Add your feature"`)
4. Push to the branch (`git push origin feature/your-feature`)
5. Open a Pull Request

---

## Author

**Prashant Singh**
- GitHub: [Happybro2005](https://github.com/Happybro2005)
- Email: prashantsingh63877@gmail.com
