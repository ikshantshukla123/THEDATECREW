import type { Metadata } from "next";
import { Palette, ShieldCheck, User } from "lucide-react";
import { ScrollablePage } from "@/components/layout/page-shell";
import { requireSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { logoutAction } from "@/features/auth/actions";
import { ThemeToggle } from "@/components/providers/theme-toggle";
import { relativeTime } from "@/lib/format";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const session = await requireSession();

  const [clientCount, lastLogin] = await Promise.all([
    prisma.profile.count({
      where: { isClient: true, matchmakerId: session.matchmakerId },
    }),
    prisma.loginAttempt.findFirst({
      where: { email: session.email, success: true },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    }),
  ]);

  return (
    <ScrollablePage>
      <div className="flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="font-display text-[28px] leading-9 text-fg">Settings</h1>
        <p className="mt-1 text-sm text-fg-muted">Your account and workspace preferences.</p>
      </div>

      <Section title="Profile" Icon={User}>
        <Row label="Name" value={session.name} />
        <Row label="Email" value={session.email} />
        <Row label="Clients assigned" value={String(clientCount)} />
        <Row label="Last sign-in" value={relativeTime(lastLogin?.createdAt ?? null)} />
      </Section>

      <Section title="Appearance" Icon={Palette}>
        <div className="flex items-center justify-between gap-4 px-5 py-4">
          <div>
            <p className="text-sm font-medium text-fg">Theme</p>
            <p className="mt-0.5 text-[13px] text-fg-muted">
              Follows your system setting until you pick one.
            </p>
          </div>
          <ThemeToggle />
        </div>
      </Section>

      <Section title="Security" Icon={ShieldCheck}>
        <Row label="Password" value="Contact your admin to change it" />
        <Row label="Session" value="Expires 8 hours after sign-in" />
        <div className="flex items-center justify-between gap-4 border-t border-border px-5 py-4">
          <div>
            <p className="text-sm font-medium text-fg">Sign out</p>
            <p className="mt-0.5 text-[13px] text-fg-muted">
              Ends this session on this device.
            </p>
          </div>
          <form action={logoutAction}>
            <button
              type="submit"
              className="min-h-10 rounded-md border border-danger/30 px-4 text-sm font-medium text-danger transition-colors hover:bg-danger/8"
            >
              Sign out
            </button>
          </form>
        </div>
      </Section>
      </div>
    </ScrollablePage>
  );
}

function Section({
  title, Icon, children,
}: {
  title: string;
  Icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-lg border border-border bg-surface">
      <h2 className="flex items-center gap-2 border-b border-border bg-surface-muted px-5 py-3 text-sm font-semibold text-fg">
        <Icon className="size-4 text-fg-muted" />
        {title}
      </h2>
      {children}
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border px-5 py-3.5 last:border-0">
      <span className="text-[13px] font-medium text-fg-muted">{label}</span>
      <span className="text-sm text-fg">{value}</span>
    </div>
  );
}
