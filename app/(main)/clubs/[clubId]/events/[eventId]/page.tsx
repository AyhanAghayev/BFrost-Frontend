import EventDetailClient from "@/components/events/EventDetailClient";

export default async function EventPage({
  params,
}: {
  params: Promise<{ clubId: string; eventId: string }>;
}) {
  const { eventId } = await params;
  return <EventDetailClient eventId={eventId} />;
}