import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import CanvasTodoList from '@/components/CanvasTodoList'
import ClassScheduleGrid from '@/components/ClassScheduleGrid'
import UserTodoList from '@/components/UserTodoList'

export default async function AcademicsPage(): Promise<React.JSX.Element> {
  const authSession = await auth()

  if (!authSession?.user?.id) {
    return <main className="mx-auto max-w-7xl px-6 py-8">Unauthorized</main>
  }

  const [{ data: classRows }, { data: taskRows }] = await Promise.all([
    supabaseAdmin.from('classes').select('*').eq('user_id', authSession.user.id),
    supabaseAdmin.from('tasks').select('*').eq('user_id', authSession.user.id),
  ])

  return (
    <main className="mx-auto w-full max-w-7xl px-6 py-8 lg:px-10">
      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          <ClassScheduleGrid />
          <section className="rounded-3xl border p-6" style={{ borderColor: '#3A0A4E' }}>
            <h1 className="text-3xl font-semibold">Academics</h1>
            <p className="mt-2 text-sm text-black/70 dark:text-white/70">Class and task data are connected to Supabase and drive the schedule and task panels below.</p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border p-4">
                <p className="text-sm text-black/70 dark:text-white/70">Classes</p>
                <p className="mt-2 text-3xl font-semibold">{classRows?.length ?? 0}</p>
              </div>
              <div className="rounded-2xl border p-4">
                <p className="text-sm text-black/70 dark:text-white/70">Tasks</p>
                <p className="mt-2 text-3xl font-semibold">{taskRows?.length ?? 0}</p>
              </div>
            </div>
          </section>
        </div>
        <div className="space-y-6">
          <CanvasTodoList />
          <UserTodoList />
        </div>
      </div>
    </main>
  )
}