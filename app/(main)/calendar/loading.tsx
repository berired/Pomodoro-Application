export default function CalendarLoading(): React.JSX.Element {
  return (
    <main className="mx-auto w-full max-w-7xl px-6 py-8 lg:px-10">
      <section className="rounded-3xl border p-6">
        <div className="h-6 w-40 animate-pulse rounded bg-black/10 dark:bg-white/10" />
        <div className="mt-4 h-10 w-64 animate-pulse rounded bg-black/10 dark:bg-white/10" />
        <div className="mt-6 grid grid-cols-7 gap-2">
          {Array.from({ length: 35 }).map((_, index) => (
            <div key={index} className="min-h-32 animate-pulse rounded-2xl bg-black/10 dark:bg-white/10" />
          ))}
        </div>
      </section>
    </main>
  )
}