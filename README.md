[README.txt](https://github.com/user-attachments/files/29994057/README.txt)
# NovaTalk

A production-ready, real-time social communication platform featuring anonymous
stranger chat, friend networking, communities, live messaging, and a
Firebase-powered admin control center — all built on React + Vite and Firebase.


## Overview

NovaTalk connects people through instant anonymous stranger chat, persistent
friendships, and topic-based communities, while giving administrators and
moderators a full "Mission Control" dashboard to manage users, review reports,
and monitor platform health in real time.


## Tech Stack

- Frontend:        React.js, Vite, HTML5, CSS3
- State/Logic:      React Context API, Custom Hooks
- Authentication:   Firebase Authentication (Email/Password, Google Sign-In)
- Database:         Cloud Firestore
- Real-Time Layer:  Firebase Realtime Database
- Storage:          Firebase Storage
- Security:         Firebase Security Rules, Role-Based Access Control (RBAC)
- Analytics:        Firebase Analytics
- Hosting:          Firebase Hosting or Vercel


## Architecture

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

See /docs/NovaTalk_Architecture_and_Features.docx for full diagrams covering:
  1. High-Level Architecture
  2. Component Architecture
  3. Data Flow Architecture
  4. Security Architecture
  5. Application Flow (User Journey)


## Firestore Collections

users/, admins/, usernames/, friends/, friendRequests/, blockedUsers/,
chats/, messages/, communities/, posts/, comments/, reports/,
supportTickets/, notifications/, auditLogs/, settings/


## Realtime Database Structure

status/, typing/, waitingUsers/, activeMatches/, presence/, voiceCalls/


## Storage Structure

profile-images/, chat-images/, voice-notes/, community-media/, documents/


## Features

### User Features
- Authentication & Security: Email/Password + Google Sign-In, email
  verification, session restoration, protected routes, offline persistence
- Profile: username, display name, avatar, bio, country, gender, DOB,
  language, interests, online status/last seen, privacy controls
- Stranger Chat: anonymous matchmaking queue, instant connection, skip/end
  chat, typing indicators, read receipts, live presence
- Friends: send/accept/reject/cancel requests, remove, block/unblock, search
- Communities: create/join/leave, feed, posts, comments, reactions, media,
  moderation
- Messaging: real-time text, emoji, images, voice notes, files, chat history,
  timestamps, read/typing status
- Calling: voice calls, incoming call notifications, call history, mute/end
- Notifications: friend requests, messages, communities, reports, system,
  real-time alerts
- Safety: report/block users, privacy settings, ban/suspension detection
- Settings: change password/email, update profile, notification & privacy
  preferences, language preferences

### Admin Mission Control
- Admin Authentication: separate login, role verification, super admin /
  moderator / support staff access, protected routes
- Live Dashboard: total & online users, active chats, matchmaking queue,
  messages, communities, reports, tickets, banned/suspended users, DB &
  storage status
- User Management: view/search/filter, suspend/ban/unban, restrict
  matchmaking, login history
- Reports Management: view/approve/reject/resolve/delete, categories,
  reporter info, history
- Chat & Community Moderation: view live chats, remove messages/posts/
  comments, delete chats/communities, ban members
- Announcements: global announcements, maintenance notices, broadcasts
- Support Center: view/assign/resolve tickets, ticket history
- Analytics: DAU/MAU, user & friend growth, message volume, report trends,
  matchmaking stats, retention
- Audit Logs: admin logins, user actions, moderation, DB changes, security
  & auth events
- Database Management: Firestore/RTDB/Storage monitoring, collection stats,
  DB health
- Security: role-based permissions, Firestore/Storage/RTDB rules, secure
  route guards, session validation, username reservation transactions

### Firebase Features
Authentication, Cloud Firestore, Realtime Database, Storage, offline
persistence, real-time listeners, transactions, batch writes, security
rules, presence system, typing indicators, automatic reconnection, live
synchronization.

### Technical Features
Responsive design, PWA-ready, dark cosmic theme with glassmorphism UI,
lazy loading, optimized Firebase queries, pagination, image compression,
error boundaries, loading skeletons, empty states, secure environment
variables, production build ready, modular/component-based architecture.

### Roadmap / Future Enhancements
Video calling, AI-powered chat moderation, AI matchmaking recommendations,
end-to-end encryption, voice & video rooms, stories/status updates, push
notifications, multi-language support, QR code profile sharing, premium
membership & subscriptions, verification badges, dark/light theme toggle,
desktop app, Android & iOS apps, AI chat assistant, live translation,
screen sharing, event-based communities, cloud backup & restore.


## Getting Started

1. Clone the repository
   git clone https://github.com/<your-org>/novatalk.git
   cd novatalk

2. Install dependencies
   npm install

3. Configure Firebase
   - Create a Firebase project at https://console.firebase.google.com
   - Enable Authentication (Email/Password + Google), Firestore, Realtime
     Database, Storage, and Analytics
   - Copy your Firebase config into a .env file at the project root:

     VITE_FIREBASE_API_KEY=your_api_key
     VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
     VITE_FIREBASE_PROJECT_ID=your_project_id
     VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
     VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
     VITE_FIREBASE_APP_ID=your_app_id
     VITE_FIREBASE_DATABASE_URL=https://your_project.firebaseio.com

4. Deploy Firestore / RTDB / Storage security rules
   firebase deploy --only firestore:rules,database,storage

5. Run the development server
   npm run dev

6. Build for production
   npm run build


## Project Structure (suggested)

novatalk/
├── src/
│   ├── components/       # Shared UI components
│   ├── pages/
│   │   ├── user/          # User portal (login, chat, friends, communities...)
│   │   └── admin/         # Admin Mission Control
│   ├── context/           # React Context providers
│   ├── hooks/              # Custom hooks
│   ├── firebase/           # Firebase config & service wrappers
│   └── App.jsx
├── firestore.rules
├── storage.rules
├── database.rules.json
├── .env
└── package.json


## Security

Access is controlled through a role-detection flow: authenticated users are
routed to either the User Portal or Admin Portal, each guarded by a
dedicated route guard (RequireAuth / RequireAdmin), before requests reach
Firestore and Realtime Database security rules. See the Security
Architecture diagram in /docs for the full flow.


## Contributing

1. Fork the repository
2. Create a feature branch (git checkout -b feature/your-feature)
3. Commit your changes (git commit -m "Add your feature")
4. Push to the branch (git push origin feature/your-feature)
5. Open a Pull Request


## License

Add your chosen license here (e.g., MIT).


## Author

Prashant Singh
GitHub: https://github.com/Happybro2005
Email: prashantsingh63877@gmail.com
