import { api } from "./client";
import type { ClubEvent } from "@/lib/types";

// ── Backend response shape ────────────────────────────────────────────────────

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
  currentUserRsvp: "ATTENDING" | "NOT_ATTENDING" | null;
  createdAt: string;
}

// ── Mapper ────────────────────────────────────────────────────────────────────

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
    isAttending: e.currentUserRsvp === "ATTENDING",
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

export async function rsvpEvent(eventId: string, status: "ATTENDING" | "NOT_ATTENDING"): Promise<void> {
  return api.post<void>(`/api/v1/events/${eventId}/rsvp?status=${status}`);
}

export async function createEvent(clubId: string, payload: {
  title: string;
  description?: string;
  format: "IN_PERSON" | "ONLINE" | "HYBRID";
  location?: string;
  startTime: string;
  endTime?: string;
  maxMembers?: number;
  coverImageUrl?: string;
}): Promise<ClubEvent> {
  const e = await api.post<ApiEvent>(`/api/v1/clubs/${clubId}/events`, payload);
  return mapEvent(e);
}

export async function updateEvent(eventId: string, payload: {
  title?: string;
  description?: string;
  format?: "IN_PERSON" | "ONLINE" | "HYBRID";
  location?: string;
  startTime?: string;
  endTime?: string;
  maxMembers?: number;
  coverImageUrl?: string;
}): Promise<ClubEvent> {
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
  respondedAt: string;
}

export async function getEventAttendees(eventId: string): Promise<EventAttendee[]> {
  return api.get<EventAttendee[]>(`/api/v1/events/${eventId}/rsvps`);
}