# BFrost — University Club Platform (Frontend)

BFrost is a social platform for university clubs. It provides club discovery
and membership management, a social feed with posts, comments, reactions and
polls, club events with RSVPs, a wiki, direct messaging, and notifications.

This repository contains the frontend web application. The companion backend
repository is linked below.

## Team

| Name                   | GitHub                          | LinkedIn                                             |
|------------------------|----------------------------------|-------------------------------------------------------|
| Ayhan Aghayev          | https://github.com/AyhanAghayev | https://www.linkedin.com/in/ayhan-agayev/            |
| Abdulvahhab Alaskarov  | https://github.com/BillerPlay   | https://www.linkedin.com/in/billerplay/              |
| Yunis Sadiq            | https://github.com/YunisSadig   | https://www.linkedin.com/in/yunis-sadiq-5a99b930b/   |
| Islam Samadov          | https://github.com/IslamSamadov | https://www.linkedin.com/in/islam-samadov-2ba9b2305/ |
| Qurbanali Qurbanaliyev | https://github.com/gurban200OK  | www.linkedin.com/in/gurbanali-gurbanaliyev-563715420 |

## Project Links

| Resource | Link |
|---|---|
| Frontend repository | [link](https://github.com/AyhanAghayev/BFrost-Frontend) |
| Backend repository | [link](https://github.com/AyhanAghayev/BFrost-Backend) |
| Live application | [link](https://b-frost.vercel.app/) |
| Backend API documentation (Swagger UI) | `/swagger-ui.html` on the deployed backend |

## Technologies Used

- Next.js 16 (App Router)
- React 19
- TypeScript
- Tailwind CSS 4
- shadcn/ui on top of Base UI (`@base-ui/react`)
- Zustand (client state — auth, theme, UI)
- STOMP over WebSocket (`@stomp/stompjs`) for real-time chat
- react-markdown + remark-gfm (wiki article rendering)
- three.js (landing page visuals)
- lucide-react (icons)

## Architecture Overview

The app uses the Next.js App Router with two top-level route groups:

```
app
├── (auth)/            Sign-in / sign-up — no navigation chrome, unauthenticated
│   ├── sign-in/
│   └── sign-up/
├── (main)/             Authenticated app shell (top nav, side nav, mobile nav)
│   ├── discover/       Club/user discovery
│   ├── clubs/          Club list, detail, creation, settings, event management, wiki
│   ├── events/         Upcoming events across joined clubs
│   ├── wiki/           Cross-club wiki index
│   ├── post/[postid]/  Single post detail
│   ├── profile/[username]/  Public user profile
│   ├── chat/           Direct messaging (STOMP/WebSocket)
│   ├── search/         Global search
│   ├── admin/          Admin dashboard
│   └── settings/       Account settings
│
├── oauth/              Google OAuth2
│   ├── callback/       
│   └── complete-registration/  
└── page.tsx            Public landing page
```

Key design points:

- `(main)/layout.tsx` wraps every authenticated route in `AuthGuard`, which
  redirects unauthenticated users before rendering the shell (`TopNavBar`,
  `SideNavBar`, `MobileNav`).
- All backend communication goes through a single fetch wrapper
  (`lib/api/client.ts`). It attaches credentials for the httpOnly refresh
  cookie, retries a request once after a transparent token refresh on a 401,
  and otherwise throws a typed `ApiError`.
- Auth state (access token, current user) is held in a Zustand store
  (`lib/stores/auth.store.ts`), not in React context, so it's readable outside
  components (e.g. the API client's 401 handler).
- Domain API calls are grouped by resource under `lib/api/` (`clubs.ts`,
  `posts.ts`, `events.ts`, `wiki.ts`, `conversations.ts`, `notifications.ts`,
  `users.ts`, `admin.ts`, `upload.ts`, `trending.ts`), mirroring the backend's
  package-by-domain structure.
- Chat connects to the backend's STOMP endpoint directly from the browser
  (`ws(s)://<api-host>/ws-native`), authenticated with the same JWT access
  token used for REST calls, and falls back to polling when the socket is
  disconnected.

## Description

The landing page (`/`) is public. Every other route lives under the `(main)`
group and requires authentication:

- Browse and search clubs, join public clubs or request to join private ones
- View a home feed of posts (text, image, link, question, or poll) from
  followed users and joined clubs; react to, comment on, save, or vote on them
- Create and manage clubs: roles, join requests, member removal, ownership
  transfer
- Browse and RSVP to club events; moderators/owners can create, edit and
  delete events
- Read and edit per-club wiki articles
- View and edit a user's public profile, follow/unfollow other users
- Direct message mutual followers in real time
- Receive notifications for follows, likes, comments and join requests (nav
  dropdown)
- Manage account settings (profile, password, email, notification
  preferences)
- Admin dashboard for platform-level moderation

## Routes

| Route | Description |
|---|---|
| `/` | Public landing page |
| `/sign-in` | Sign in (email/password or Google OAuth2) |
| `/sign-up` | Create an account |
| `/discover` | Discover clubs and users |
| `/search` | Global search |
| `/clubs` | List clubs |
| `/clubs/new` | Create a club |
| `/clubs/[clubId]` | Club detail — feed, members, events, wiki |
| `/clubs/[clubId]/settings` | Club settings (moderator/owner) |
| `/clubs/[clubId]/manage/events` | Manage a club's events (moderator/owner) |
| `/clubs/[clubId]/events/[eventId]` | Event detail and RSVP |
| `/clubs/[clubId]/wiki/new` | Create a wiki article |
| `/clubs/[clubId]/wiki/[articleId]` | Read a wiki article |
| `/clubs/[clubId]/wiki/[articleId]/edit` | Edit a wiki article |
| `/wiki` | Wiki articles across all clubs |
| `/events` | Upcoming events across joined clubs |
| `/post/[postid]` | Post detail |
| `/profile/[username]` | Public user profile |
| `/chat` | Direct messages |
| `/settings` | Account settings |
| `/admin` | Admin dashboard |

## Installation

Prerequisites:

- Node.js 20 or later
- A running instance of the [backend API](https://github.com/AyhanAghayev/BFrost-Backend)

Steps:

```bash
# 1. Install dependencies
npm install

# 2. Configure environment variables
# create .env.local in the project root:
echo "NEXT_PUBLIC_API_URL=http://localhost:8080" > .env.local

# 3. Build
npm run build
```

### Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `NEXT_PUBLIC_API_URL` | No | `http://localhost:8080` | Base URL of the backend API. Also used to derive the WebSocket URL (`ws(s)://<host>/ws-native`) for chat. |

## Development

Run the dev server:

```bash
npm run dev
```

The app is served at `http://localhost:3000`. The backend must be running
and reachable at `NEXT_PUBLIC_API_URL` (default `http://localhost:8080`),
with `OAUTH_SUCCESS_REDIRECT`/`OAUTH_FAILURE_REDIRECT` on the backend pointed
back at this frontend if Google login is used.

Run in production mode locally:

```bash
npm run build
npm run start
```

## Screenshots

https://stitch.withgoogle.com/projects/3313855988926127545