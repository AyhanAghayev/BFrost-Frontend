import WikiArticleClient from "@/components/wiki/WikiArticleClient";

export default async function WikiArticlePage({
  params,
}: {
  params: Promise<{ clubId: string; articleId: string }>;
}) {
  const { clubId, articleId } = await params;
  return <WikiArticleClient clubSlug={clubId} articleId={articleId} />;
}
