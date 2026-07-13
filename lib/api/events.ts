import { api } from "./client";
import type { ClubEvent, EventQuestion, QuestionType } from "@/lib/types";

interface ApiQuestion {
  id: string;
  label: string;
  type: QuestionType;
  required: boolean;
  position: number;
  options: string[];
}

export interface ApiEvent {
  id: string;
  clubId: string;
  clubSlug: string;
  clubName: string;
  title: string;
  description: string | null;
  coverImageUrl: string | null;
  format: "IN_PERSON" | "ONLINE" | "HYBRID";
  location: string | null;
  startTime: string;
  endTime: string | null;
  maxMembers: number | null;
  createdBy: string;
  attendingCount: number;
  waitlistCount: number;
  currentUserRsvp: "ATTENDING" | "NOT_ATTENDING" | "WAITLISTED" | null;
  questions: ApiQuestion[];
  createdAt: string;
}

// A question in a create/edit payload (no id — the server rebuilds them).
export interface QuestionInput {
  label: string;
  type: QuestionType;
  required: boolean;
  options?: string[];
}

export interface AnswerInput {
  questionId: string;
  value: string;
}

export function mapEvent(e: ApiEvent): ClubEvent {
  return {
    id: e.id,
    clubId: e.clubId,
    clubSlug: e.clubSlug,
    clubName: e.clubName,
    title: e.title,
    description: e.description ?? "",
    coverImageUrl: e.coverImageUrl,
    format: e.format === "IN_PERSON" ? "in-person" : e.format === "ONLINE" ? "online" : "hybrid",
    location: e.location ?? "",
    startsAt: e.startTime,
    endsAt: e.endTime ?? e.startTime,
    maxMembers: e.maxMembers,
    attendeeCount: e.attendingCount,
    waitlistCount: e.waitlistCount,
    isAttending: e.currentUserRsvp === "ATTENDING",
    myRsvpStatus: e.currentUserRsvp,
    questions: e.questions as EventQuestion[],
    organizerId: e.createdBy,
  };
}

// ── API calls ─────────────────────────────────────────────────────────────────

export async function getMyEventFeed(): Promise<ClubEvent[]> {
  const results = await api.get<ApiEvent[]>("/api/v1/events");
  return results.map(mapEvent);
}

export async function getClubEvents(clubId: string, includePast = false): Promise<ClubEvent[]> {
  const qs = includePast ? "?includePast=true" : "";
  const results = await api.get<ApiEvent[]>(`/api/v1/clubs/${clubId}/events${qs}`);
  return results.map(mapEvent);
}

export async function getEvent(eventId: string): Promise<ClubEvent> {
  const e = await api.get<ApiEvent>(`/api/v1/events/${eventId}`);
  return mapEvent(e);
}

export type RsvpStatus = "ATTENDING" | "NOT_ATTENDING" | "WAITLISTED";

// Returns the effective status (ATTENDING may come back WAITLISTED if the event is full).
export async function rsvpEvent(
  eventId: string,
  status: "ATTENDING" | "NOT_ATTENDING",
  answers: AnswerInput[] = []
): Promise<RsvpStatus> {
  const res = await api.post<{ status: RsvpStatus }>(`/api/v1/events/${eventId}/rsvp`, { status, answers });
  return res.status;
}

interface EventWritePayload {
  title?: string;
  description?: string;
  format?: "IN_PERSON" | "ONLINE" | "HYBRID";
  location?: string;
  startTime?: string;
  endTime?: string;
  maxMembers?: number;
  coverImageUrl?: string;
  questions?: QuestionInput[];
}

export async function createEvent(clubId: string, payload: EventWritePayload & {
  title: string; format: "IN_PERSON" | "ONLINE" | "HYBRID"; startTime: string;
}): Promise<ClubEvent> {
  const e = await api.post<ApiEvent>(`/api/v1/clubs/${clubId}/events`, payload);
  return mapEvent(e);
}

export async function updateEvent(eventId: string, payload: EventWritePayload): Promise<ClubEvent> {
  const e = await api.patch<ApiEvent>(`/api/v1/events/${eventId}`, payload);
  return mapEvent(e);
}

export async function deleteEvent(eventId: string): Promise<void> {
  return api.delete<void>(`/api/v1/events/${eventId}`);
}

export interface EventAttendee {
  userId: string;
  username: string;
  displayName: string;
  profilePictureUrl: string | null;
  attended: boolean;
  respondedAt: string;
}

export async function getEventAttendees(eventId: string): Promise<EventAttendee[]> {
  return api.get<EventAttendee[]>(`/api/v1/events/${eventId}/rsvps`);
}

export interface EventResponse {
  userId: string;
  username: string;
  displayName: string;
  profilePictureUrl: string | null;
  status: RsvpStatus;
  attended: boolean;
  answers: { questionId: string; label: string; value: string }[];
}

export async function getEventResponses(eventId: string): Promise<EventResponse[]> {
  return api.get<EventResponse[]>(`/api/v1/events/${eventId}/responses`);
}

export async function checkInAttendee(eventId: string, userId: string, attended: boolean): Promise<void> {
  return api.post<void>(`/api/v1/events/${eventId}/attendees/${userId}/checkin`, { attended });
}
