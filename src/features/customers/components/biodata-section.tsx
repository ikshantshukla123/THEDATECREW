export type Field = { label: string; value: string | null | undefined };

/**
 * Two-column label/value grid on desktop, one on mobile. Empty values read
 * "Not specified" rather than leaving a hole — UI-UX.md §7.3.
 */
export function BiodataSection({
  title,
  fields,
  children,
}: {
  title: string;
  fields?: Field[];
  children?: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-border bg-surface">
      <h3 className="border-b border-border bg-surface-muted px-5 py-3 text-sm font-semibold text-fg">
        {title}
      </h3>
      <div className="p-5">
        {fields && (
          <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
            {fields.map(({ label, value }) => (
              <div key={label}>
                <dt className="text-[13px] font-medium text-fg-muted">{label}</dt>
                <dd className={value ? "mt-0.5 text-sm text-fg" : "mt-0.5 text-sm text-fg-subtle"}>
                  {value || "Not specified"}
                </dd>
              </div>
            ))}
          </dl>
        )}
        {children}
      </div>
    </section>
  );
}

export function Chips({ items, empty }: { items: string[]; empty: string }) {
  if (items.length === 0) {
    return <p className="text-sm text-fg-subtle">{empty}</p>;
  }
  return (
    <ul className="flex flex-wrap gap-2">
      {items.map((item) => (
        <li
          key={item}
          className="rounded-full border border-border bg-surface-muted px-3 py-1.5 text-[13px] text-fg"
        >
          {item}
        </li>
      ))}
    </ul>
  );
}
