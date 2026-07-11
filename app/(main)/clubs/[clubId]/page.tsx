import ClubPageClient from "@/components/club/ClubPageClient";

export default async function ClubPage({
  params,
}: {
  params: Promise<{ clubId: string }>;
}) {
  const { clubId } = await params;
  return <ClubPageClient slug={clubId} />;
}