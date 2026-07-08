import TopNavBar from "@/components/layout/TopNavBar";
import AuthGuard from "@/components/layout/AuthGuard";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <TopNavBar />
      <div className="w-full max-w-container-max mx-auto flex min-w-0">
        {children}
      </div>
    </AuthGuard>
  );
}