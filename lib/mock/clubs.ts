import type { Club } from "@/lib/types";

export const MOCK_CLUBS: Club[] = [
  {
    id: "c-001",
    name: "Robotics & AI Club",
    slug: "robotics-ai",
    description:
      "We build robots, explore machine learning, and compete in national robotics championships. Open to all skill levels.",
    coverImageUrl: "https://picsum.photos/seed/robotics/1200/400",
    logoUrl: null,
    category: "Technology",
    university: "Azerbaijan State University",
    memberCount: 312,
    eventCount: 48,
    articleCount: 94,
    isPublic: true,
    currentUserRole: "member",
    isMember: true,
    createdAt: "2022-09-01T00:00:00Z",
    moderators: [
      {
        id: "u-002",
        displayName: "Leyla Mammadova",
        avatarUrl: "https://api.dicebear.com/9.x/avataaars/svg?seed=leyla",
      },
    ],
    tags: ["robotics", "AI", "machine-learning", "hardware"],
  },
  {
    id: "c-002",
    name: "Photography Society",
    slug: "photography-society",
    description:
      "Weekly photo walks, darkroom workshops, and an annual exhibition. Everyone from beginners to professionals is welcome.",
    coverImageUrl: "https://picsum.photos/seed/photo/1200/400",
    logoUrl: null,
    category: "Arts",
    university: "Azerbaijan State University",
    memberCount: 178,
    eventCount: 22,
    articleCount: 41,
    isPublic: true,
    currentUserRole: "guest",
    isMember: false,
    createdAt: "2021-03-10T00:00:00Z",
    moderators: [
      {
        id: "u-004",
        displayName: "Sara Huseynova",
        avatarUrl: "https://api.dicebear.com/9.x/avataaars/svg?seed=sara",
      },
    ],
    tags: ["photography", "art", "exhibition"],
  },
  {
    id: "c-003",
    name: "Entrepreneurship Hub",
    slug: "entrepreneurship-hub",
    description:
      "Pitch nights, startup mentorship sessions, and a shared workspace. Turn your idea into a venture.",
    coverImageUrl: "https://picsum.photos/seed/startup/1200/400",
    logoUrl: null,
    category: "Business",
    university: "Azerbaijan State University",
    memberCount: 524,
    eventCount: 63,
    articleCount: 130,
    isPublic: true,
    currentUserRole: "owner",
    isMember: true,
    createdAt: "2020-11-15T00:00:00Z",
    moderators: [
      {
        id: "u-001",
        displayName: "Ayhan Agayev",
        avatarUrl: "https://api.dicebear.com/9.x/avataaars/svg?seed=ayhan",
      },
      {
        id: "u-003",
        displayName: "Julian Thorne",
        avatarUrl: "https://api.dicebear.com/9.x/avataaars/svg?seed=julian",
      },
    ],
    tags: ["startup", "business", "networking", "pitch"],
    moderationStats: { pendingRequests: 12, openReports: 0 },
  },
  {
    id: "c-004",
    name: "Chess & Strategy Club",
    slug: "chess-strategy",
    description:
      "Competitive chess training, tournament prep, and casual games every Friday evening.",
    coverImageUrl: "https://picsum.photos/seed/chess/1200/400",
    logoUrl: null,
    category: "Academic",
    university: "Baku Engineering University",
    memberCount: 89,
    eventCount: 34,
    articleCount: 27,
    isPublic: true,
    currentUserRole: "guest",
    isMember: false,
    createdAt: "2023-01-05T00:00:00Z",
    moderators: [
      {
        id: "u-005",
        displayName: "Kamran Aliyev",
        avatarUrl: "https://api.dicebear.com/9.x/avataaars/svg?seed=kamran",
      },
    ],
    tags: ["chess", "strategy", "tournament"],
  },
  {
    id: "c-005",
    name: "Volunteer Network",
    slug: "volunteer-network",
    description:
      "Coordinating community service projects across Baku. Join us for clean-up drives, tutoring, and social impact campaigns.",
    coverImageUrl: "https://picsum.photos/seed/volunteer/1200/400",
    logoUrl: null,
    category: "Volunteering",
    university: "Azerbaijan State University",
    memberCount: 741,
    eventCount: 112,
    articleCount: 58,
    isPublic: true,
    currentUserRole: "moderator",
    isMember: true,
    createdAt: "2019-05-20T00:00:00Z",
    moderators: [
      {
        id: "u-002",
        displayName: "Leyla Mammadova",
        avatarUrl: "https://api.dicebear.com/9.x/avataaars/svg?seed=leyla",
      },
      {
        id: "u-004",
        displayName: "Sara Huseynova",
        avatarUrl: "https://api.dicebear.com/9.x/avataaars/svg?seed=sara",
      },
    ],
    tags: ["volunteering", "community", "social-impact"],
    moderationStats: { pendingRequests: 3, openReports: 1 },
  },
  {
    id: "c-006",
    name: "Game Dev Guild",
    slug: "game-dev-guild",
    description:
      "Build games, run game jams, and demo projects every semester. Unity, Godot, and custom engines welcome.",
    coverImageUrl: "https://picsum.photos/seed/gamedev/1200/400",
    logoUrl: null,
    category: "Gaming",
    university: "Baku Engineering University",
    memberCount: 203,
    eventCount: 19,
    articleCount: 45,
    isPublic: true,
    currentUserRole: "guest",
    isMember: false,
    createdAt: "2022-02-14T00:00:00Z",
    moderators: [
      {
        id: "u-005",
        displayName: "Kamran Aliyev",
        avatarUrl: "https://api.dicebear.com/9.x/avataaars/svg?seed=kamran",
      },
    ],
    tags: ["gamedev", "unity", "godot", "jam"],
  },
];

export function getClubById(id: string): Club | undefined {
  return MOCK_CLUBS.find((c) => c.id === id);
}

export function getClubBySlug(slug: string): Club | undefined {
  return MOCK_CLUBS.find((c) => c.slug === slug);
}

export function getClubsByCategory(category: string): Club[] {
  return MOCK_CLUBS.filter((c) => c.category === category);
}

export function getUserClubs(userId: string): Club[] {
  return MOCK_CLUBS.filter((c) => c.isMember || c.moderators.some((m) => m.id === userId));
}
