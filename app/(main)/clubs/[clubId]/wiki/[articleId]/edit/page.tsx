import WikiEditorClient from "@/components/wiki/WikiEditorClient";

export default async function EditWikiArticlePage({
  params,
}: {
  params: Promise<{ clubId: string; articleId: string }>;
}) {
  const { clubId, articleId } = await params;
  return <WikiEditorClient clubSlug={clubId} articleId={articleId} />;
}
