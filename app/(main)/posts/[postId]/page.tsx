import PostDetailClient from "@/components/post/PostDetailClient";

export default async function PostPage({
  params,
}: {
  params: Promise<{ postId: string }>;
}) {
  const { postId } = await params;
  return <PostDetailClient postId={postId} />;
}