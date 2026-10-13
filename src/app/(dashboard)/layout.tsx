import { requireSession } from "@/lib/auth/session";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";

export default async function DashboardLayout({
  children,
}: { children: React.ReactNode }) {
  const session = await requireSession();

  // `fixed inset-0` rather than `h-dvh`: taking the shell out of flow is the
  // only way to guarantee the document cannot grow. With `h-dvh`, a tall
  // table still inflates documentElement.scrollHeight even though its own
  // container clips it, which let the whole page scroll away.
  //
  // `main` does not scroll — each page decides what scrolls inside it, so the
  // client table can pin its header and scroll only its rows.
  return (
    <div className="fixed inset-0 flex overflow-hidden">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar session={session} />
        <main className="min-h-0 flex-1 overflow-hidden">{children}</main>
        <MobileNav />
      </div>
    </div>
  );
}
