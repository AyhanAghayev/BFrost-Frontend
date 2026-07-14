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