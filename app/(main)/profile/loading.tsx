export default function ProfileLoading(): React.JSX.Element {
  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-8 lg:px-10">
      <section className="rounded-3xl border p-6">
        <div className="h-6 w-28 animate-pulse rounded bg-black/10 dark:bg-white/10" />
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-20 animate-pulse rounded-2xl bg-black/10 dark:bg-white/10" />
          ))}
        </div>
      </section>
      <section className="mt-6 rounded-3xl border p-6">
        <div className="h-6 w-36 animate-pulse rounded bg-black/10 dark:bg-white/10" />
        <div className="mt-4 h-24 animate-pulse rounded-2xl bg-black/10 dark:bg-white/10" />
      </section>
    </main>
  )
}