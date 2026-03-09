export const dynamic = "force-dynamic";

import { MainHeader } from "@/components/main-header";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-background relative flex min-h-screen flex-col">
      {/* Background Decor */}
      <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] bg-[size:40px_40px]" />

      <MainHeader />

      <main className="relative flex-1">{children}</main>
    </div>
  );
}
