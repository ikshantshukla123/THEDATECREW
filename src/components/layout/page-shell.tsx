/**
 * For pages whose content simply flows and scrolls as a whole.
 * The client list does not use this — it pins its own chrome instead.
 */
export function ScrollablePage({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-full overflow-y-auto px-5 py-6 lg:px-8 lg:py-8">
      <div className="mx-auto w-full max-w-[1320px]">{children}</div>
    </div>
  );
}

/** For pages that fill the viewport and scroll something inside themselves. */
export function FixedPage({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full flex-col px-5 py-6 lg:px-8 lg:py-8">
      <div className="mx-auto flex min-h-0 w-full max-w-[1320px] flex-1 flex-col">
        {children}
      </div>
    </div>
  );
}
