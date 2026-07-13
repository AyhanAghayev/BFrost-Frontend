import type { ClubEvent } from "@/lib/types";

export const MOCK_EVENTS: ClubEvent[] = [
  {
    id: "e-007",
    clubId: "c-001",
    clubSlug: "c-001",
    clubName: "Robotics & AI Club",
    title: "Arduino Basics Workshop",
    description: "Hands-on intro to microcontroller programming. Build a simple sensor array and learn GPIO pin control.",
    coverImageUrl: "https://picsum.photos/seed/arduino/800/400",
    format: "in-person",
    location: "Engineering Building, Lab 3",
    startsAt: "2026-04-10T10:00:00Z",
    endsAt: "2026-04-10T13:00:00Z",
    maxMembers: null,
    attendeeCount: 28,
    waitlistCount: 0,
    myRsvpStatus: null,
    questions: [],
    isAttending: false,
    organizerId: "u-002",
  },
  {
    id: "e-008",
    clubId: "c-001",
    clubSlug: "c-001",
    clubName: "Robotics & AI Club",
    title: "AI Ethics Panel Discussion",
    description: "Faculty and students discuss ethical considerations in modern AI deployment and data privacy.",
    coverImageUrl: "https://picsum.photos/seed/aiethics/800/400",
    format: "hybrid",
    location: "Main Hall + Zoom",
    startsAt: "2026-05-20T15:00:00Z",
    endsAt: "2026-05-20T17:30:00Z",
    maxMembers: null,
    attendeeCount: 52,
    waitlistCount: 0,
    myRsvpStatus: null,
    questions: [],
    isAttending: false,
    organizerId: "u-001",
  },
  {
    id: "e-001",
    clubId: "c-001",
    clubSlug: "c-001",
    clubName: "Robotics & AI Club",
    title: "Intro to ROS 2 Workshop",
    description:
      "A hands-on session covering Robot Operating System 2 fundamentals. Bring your laptop. No prior experience required.",
    coverImageUrl: "https://picsum.photos/seed/ros/800/400",
    format: "in-person",
    location: "Engineering Building, Lab 3",
    startsAt: "2026-06-14T10:00:00Z",
    endsAt: "2026-06-14T13:00:00Z",
    maxMembers: null,
    attendeeCount: 34,
    waitlistCount: 0,
    myRsvpStatus: null,
    questions: [],
    isAttending: true,
    organizerId: "u-002",
  },
  {
    id: "e-002",
    clubId: "c-003",
    clubSlug: "c-003",
    clubName: "Entrepreneurship Hub",
    title: "Pitch Night — Summer Edition",
    description:
      "Five student teams pitch their startup ideas to a panel of investors and mentors. Open to all attendees.",
    coverImageUrl: "https://picsum.photos/seed/pitch/800/400",
    format: "in-person",
    location: "Main Auditorium, Block A",
    startsAt: "2026-06-17T17:00:00Z",
    endsAt: "2026-06-17T20:00:00Z",
    maxMembers: null,
    attendeeCount: 112,
    waitlistCount: 0,
    myRsvpStatus: null,
    questions: [],
    isAttending: false,
    organizerId: "u-001",
  },
  {
    id: "e-003",
    clubId: "c-005",
    clubSlug: "c-005",
    clubName: "Volunteer Network",
    title: "City Park Clean-Up Drive",
    description:
      "Join us for a morning of community service at Baku's National Park. Gloves and bags provided.",
    coverImageUrl: "https://picsum.photos/seed/cleanup/800/400",
    format: "in-person",
    location: "National Park, East Gate",
    startsAt: "2026-06-22T08:00:00Z",
    endsAt: "2026-06-22T12:00:00Z",
    maxMembers: null,
    attendeeCount: 67,
    waitlistCount: 0,
    myRsvpStatus: null,
    questions: [],
    isAttending: true,
    organizerId: "u-002",
  },
  {
    id: "e-004",
    clubId: "c-006",
    clubSlug: "c-006",
    clubName: "Game Dev Guild",
    title: "48-Hour Game Jam",
    description:
      "This semester's theme will be revealed at kickoff. Form teams of 1–4. Prizes for top 3 entries.",
    coverImageUrl: "https://picsum.photos/seed/gamejam/800/400",
    format: "hybrid",
    location: "Computer Lab 7 + Discord",
    startsAt: "2026-07-04T18:00:00Z",
    endsAt: "2026-07-06T18:00:00Z",
    maxMembers: null,
    attendeeCount: 41,
    waitlistCount: 0,
    myRsvpStatus: null,
    questions: [],
    isAttending: false,
    organizerId: "u-005",
  },
  {
    id: "e-005",
    clubId: "c-002",
    clubSlug: "c-002",
    clubName: "Photography Society",
    title: "Portrait Lighting Masterclass",
    description:
      "Guest photographer Nigar Rashidova walks through studio lighting setups and editing workflows.",
    coverImageUrl: "https://picsum.photos/seed/portrait/800/400",
    format: "online",
    location: "Zoom (link sent to members)",
    startsAt: "2026-06-25T14:00:00Z",
    endsAt: "2026-06-25T16:00:00Z",
    maxMembers: null,
    attendeeCount: 88,
    waitlistCount: 0,
    myRsvpStatus: null,
    questions: [],
    isAttending: false,
    organizerId: "u-004",
  },
  {
    id: "e-006",
    clubId: "c-004",
    clubSlug: "c-004",
    clubName: "Chess & Strategy Club",
    title: "Inter-University Chess Tournament",
    description:
      "Round-robin format, Swiss system. Register individually or bring a team. Top 3 win trophies.",
    coverImageUrl: "https://picsum.photos/seed/chess-tournament/800/400",
    format: "in-person",
    location: "Student Union, Room 204",
    startsAt: "2026-07-10T09:00:00Z",
    endsAt: "2026-07-10T18:00:00Z",
    maxMembers: null,
    attendeeCount: 30,
    waitlistCount: 0,
    myRsvpStatus: null,
    questions: [],
    isAttending: false,
    organizerId: "u-005",
  },
];

export function getEventById(id: string): ClubEvent | undefined {
  return MOCK_EVENTS.find((e) => e.id === id);
}

export function getEventsByClub(clubId: string): ClubEvent[] {
  return MOCK_EVENTS.filter((e) => e.clubId === clubId);
}

export function getAllEvents(): ClubEvent[] {
  return [...MOCK_EVENTS].sort(
    (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()
  );
}

export function getUpcomingEvents(): ClubEvent[] {
  const now = new Date().toISOString();
  return MOCK_EVENTS.filter((e) => e.startsAt > now).sort(
    (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()
  );
}
