# NovaTalk

<p align="center">
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white" alt="React 19" />
  <img src="https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white" alt="Vite 8" />
  <img src="https://img.shields.io/badge/TypeScript-6-3178C6?logo=typescript&logoColor=white" alt="TypeScript 6" />
  <img src="https://img.shields.io/badge/Firebase-Ready-FFCA28?logo=firebase&logoColor=black" alt="Firebase ready" />
</p>

<p align="center">
  <img width="1200" src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1400&q=80" alt="NovaTalk product preview" />
</p>

<p align="center">
  <strong>NovaTalk</strong>
  <br>
  <em>Where conversation becomes community.</em>
</p>

<p align="center">
  <a href="#quick-start"><img src="https://img.shields.io/badge/Quick%20Start-Run%20App-00C2FF?style=for-the-badge" alt="Quick start" /></a>
  <a href="#features"><img src="https://img.shields.io/badge/Features-Explore-8B5CF6?style=for-the-badge" alt="Explore features" /></a>
  <a href="#roadmap"><img src="https://img.shields.io/badge/Roadmap-View-34D399?style=for-the-badge" alt="View roadmap" /></a>
</p>

## Founder narrative

NovaTalk is being built to solve a simple but important problem: online social products often feel noisy, transactional, or disconnected from real human connection.

We believe social platforms should help people meet, talk, and build trust quickly without friction. NovaTalk brings anonymous conversation, friend discovery, study communities, and operational tooling into one premium product experience designed for modern digital communities.

This project represents a product-first vision: a polished social experience with the structure of a scalable platform, built on a modern frontend stack and ready for Firebase-backed expansion.

## Why this matters

- The internet is saturated with generic social apps, but few combine anonymity, safety, and community in one product.
- Students and communities need spaces that feel lively, intentional, and easy to trust.
- A premium product experience can significantly improve engagement and retention when paired with meaningful social mechanics.

## Product overview

| Pillar | Strategic value |
| --- | --- |
| Anonymous discovery | Fast user onboarding and low-friction social interaction |
| Friend networking | Trusted relationship building and retention |
| Community spaces | Study groups, shared interests, and belonging |
| Admin operations | Moderation, safety, and platform governance |
| Premium UX | Brand trust, engagement, and long-term product differentiation |

## Quick start

```bash
npm install
npm run dev
```

Then open the local URL printed in the terminal.

## Features

### Social product layer

- Anonymous stranger matching
- Friend request and connection management
- Real-time messaging workflows
- Notifications and user engagement signals
- Study groups and community interaction

### Platform operations layer

- Protected admin access
- Mission control dashboard
- Moderation and reporting workflows
- User lifecycle and safety management
- Growth analytics and operational visibility

### Product experience layer

- Premium cosmic design language
- Responsive multi-device layout
- Dark and light mode readiness
- Conversion-oriented product UI system

## Tech stack

- React 19
- Vite 8
- TypeScript 6
- Tailwind CSS v4
- Framer Motion
- Lucide icons
- React Router
- Firebase-ready architecture

## Architecture

```text
Users / Admins
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
Route Guards + Security Rules
```

## Data model

### Firestore collections

`users/`, `admins/`, `usernames/`, `friends/`, `friendRequests/`, `blockedUsers/`, `chats/`, `messages/`, `communities/`, `posts/`, `comments/`, `reports/`, `supportTickets/`, `notifications/`, `auditLogs/`, `settings/`

### Realtime paths

`status/`, `typing/`, `waitingUsers/`, `activeMatches/`, `presence/`, `voiceCalls/`

### Storage folders

`profile-images/`, `chat-images/`, `voice-notes/`, `community-media/`, `documents/`

## Firebase configuration

Create a Firebase project and enable Authentication, Firestore, Realtime Database, Storage, and Analytics.

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_DATABASE_URL=https://your_project.firebaseio.com
```

Then deploy the rules:

```bash
firebase deploy --only firestore:rules,database,storage
```

## Roadmap

- Video calling
- Community moderation tools
- Smart matchmaking
- Encrypted communications
- Voice and video rooms
- Push notifications
- Cross-platform expansion

## Docs

- [docs/AI_HANDOFF.md](docs/AI_HANDOFF.md)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Open a pull request

## Credits

- Built for NovaTalk by Shubh Tamrakar
- Concept contribution by Prashant Singh

## License

This project is currently in active development as a portfolio and prototype build.
