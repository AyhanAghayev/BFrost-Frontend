import type { ClubEvent } from "@/lib/types";

// Anchor mock events to the current date so the demo always has a realistic
// mix of past and upcoming events
function eventDates(daysFromNow: number, startHour: number, durationHours: number) {
  const start = new Date();
  start.setUTCDate(start.getUTCDate() + daysFromNow);
  start.setUTCHours(startHour, 0, 0, 0);
  const end = new Date(start.getTime() + durationHours * 60 * 60 * 1000);
  return { startsAt: start.toISOString(), endsAt: end.toISOString() };
}

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
    ...eventDates(-14, 10, 3),
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
    ...eventDates(-5, 15, 2.5),
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
    ...eventDates(1, 10, 3),
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
    ...eventDates(2, 17, 3),
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
    ...eventDates(3, 8, 4),
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
    ...eventDates(8, 18, 48),
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
    ...eventDates(5, 14, 2),
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
    ...eventDates(12, 9, 9),
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
