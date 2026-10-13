import type { Metadata } from "next";
import Link from "next/link";
import type { Gender, PipelineStatus } from "@prisma/client";
import { requireSession } from "@/lib/auth/session";
import { getClientList, PER_PAGE } from "@/features/customers/service";
import { CustomerTable } from "@/features/customers/components/customer-table";
import { CustomerFilters } from "@/features/customers/components/customer-filters";
import { EmptyState } from "@/components/shared/empty-state";
import { Pagination } from "@/components/shared/pagination";
import { FixedPage } from "@/components/layout/page-shell";

export const metadata: Metadata = { title: "Your clients" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const session = await requireSession();
  const sp = await searchParams;

  const page = Math.max(1, Number(one(sp.page) ?? 1) || 1);
  const { rows, total, statusCounts, totalPages } = await getClientList(
    session.matchmakerId,
    {
      search: one(sp.q),
      status: one(sp.status) as PipelineStatus | undefined,
      gender: one(sp.gender) as Gender | undefined,
      needsAttention: one(sp.attention) === "1",
      page,
      perPage: PER_PAGE,
    },
  );

  const allClients = Object.values(statusCounts).reduce((a, b) => a + b, 0);

  return (
    <FixedPage>
      <div className="shrink-0">
        <h1 className="font-display text-[28px] leading-9 text-fg">Your clients</h1>
        <p className="mt-1 text-sm text-fg-muted">
          {total} {total === 1 ? "client" : "clients"}
          {total !== allClients && ` of ${allClients}`}
        </p>
      </div>

      <div className="mt-4 shrink-0">
        <CustomerFilters counts={statusCounts} total={allClients} />
      </div>

      {rows.length === 0 ? (
        <div className="mt-5">
          <EmptyState
            title="No clients match these filters"
            description="Try widening the search or clearing the status filter."
            action={
              <Link
                href="/customers"
                className="inline-flex min-h-10 items-center rounded-full bg-primary px-5 font-semibold text-primary-fg transition-colors hover:bg-primary-hover"
              >
                Clear filters
              </Link>
            }
          />
        </div>
      ) : (
        <>
          <div className="mt-5 flex min-h-0 flex-1 flex-col">
            <CustomerTable rows={rows} />
          </div>
          <div className="shrink-0 pt-4">
            <Pagination
              page={page}
              totalPages={totalPages}
              total={total}
              perPage={PER_PAGE}
              buildHref={(n) => {
                const next = new URLSearchParams();
                for (const [k, v] of Object.entries(sp)) {
                  const value = Array.isArray(v) ? v[0] : v;
                  if (value && k !== "page") next.set(k, value);
                }
                if (n > 1) next.set("page", String(n));
                const qs = next.toString();
                return qs ? `/customers?${qs}` : "/customers";
              }}
            />
          </div>
        </>
      )}
    </FixedPage>
  );
}
