export default function AcademicsLoading(): React.JSX.Element {
  return (
    <main className="mx-auto w-full max-w-7xl px-6 py-8 lg:px-10">
      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          <section className="rounded-3xl border p-6">
            <div className="h-6 w-40 animate-pulse rounded bg-black/10 dark:bg-white/10" />
            <div className="mt-4 h-10 w-72 animate-pulse rounded bg-black/10 dark:bg-white/10" />
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="h-24 animate-pulse rounded-2xl bg-black/10 dark:bg-white/10" />
              <div className="h-24 animate-pulse rounded-2xl bg-black/10 dark:bg-white/10" />
            </div>
          </section>
          <section className="rounded-3xl border p-6">
            <div className="h-6 w-32 animate-pulse rounded bg-black/10 dark:bg-white/10" />
            <div className="mt-3 h-4 w-full animate-pulse rounded bg-black/10 dark:bg-white/10" />
          </section>
        </div>
        <div className="space-y-6">
          <section className="rounded-3xl border p-6">
            <div className="h-6 w-44 animate-pulse rounded bg-black/10 dark:bg-white/10" />
            <div className="mt-6 space-y-3">
              <div className="h-20 animate-pulse rounded-2xl bg-black/10 dark:bg-white/10" />
              <div className="h-20 animate-pulse rounded-2xl bg-black/10 dark:bg-white/10" />
            </div>
          </section>
          <section className="rounded-3xl border p-6">
            <div className="h-6 w-32 animate-pulse rounded bg-black/10 dark:bg-white/10" />
            <div className="mt-6 space-y-3">
              <div className="h-16 animate-pulse rounded-2xl bg-black/10 dark:bg-white/10" />
              <div className="h-16 animate-pulse rounded-2xl bg-black/10 dark:bg-white/10" />
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}