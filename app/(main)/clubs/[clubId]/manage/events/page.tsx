import ClubEventsManageClient from "@/components/club/manage/ClubEventsManageClient";

export default async function ClubEventsManagePage({
  params,
}: {
  params: Promise<{ clubId: string }>;
}) {
  const { clubId } = await params;
  return <ClubEventsManageClient slug={clubId} />;
}
