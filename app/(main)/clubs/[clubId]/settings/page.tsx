import ClubSettingsClient from "@/components/club/ClubSettingsClient";

export default async function ClubSettingsPage({
  params,
}: {
  params: Promise<{ clubId: string }>;
}) {
  const { clubId } = await params;
  return <ClubSettingsClient slug={clubId} />;
}
