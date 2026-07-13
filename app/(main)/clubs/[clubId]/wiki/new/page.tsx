import WikiEditorClient from "@/components/wiki/WikiEditorClient";

export default async function NewWikiArticlePage({
  params,
}: {
  params: Promise<{ clubId: string }>;
}) {
  const { clubId } = await params;
  return <WikiEditorClient clubSlug={clubId} />;
}
