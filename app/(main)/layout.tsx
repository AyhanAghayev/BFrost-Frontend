import TopNavBar from "@/components/layout/TopNavBar";
import SideNavBar from "@/components/layout/SideNavBar";
import MobileNav from "@/components/layout/MobileNav";
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
        <SideNavBar />
        {children}
      </div>
      <MobileNav />
    </AuthGuard>
  );
}
