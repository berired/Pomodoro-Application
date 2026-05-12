import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import CalendarView from '@/components/CalendarView'

export default async function CalendarPage(): Promise<React.JSX.Element> {
  const authSession = await auth()

  if (!authSession?.user?.id) {
    return <main className="mx-auto max-w-7xl px-6 py-8">Unauthorized</main>
  }

  const [{ data: taskRows, error: taskError }, { data: classRows, error: classError }] = await Promise.all([
    supabaseAdmin.from('tasks').select('*').eq('user_id', authSession.user.id).order('date', { ascending: true }),
    supabaseAdmin.from('classes').select('*').eq('user_id', authSession.user.id).order('created_at', { ascending: true }),
  ])

  if (taskError || classError) {
    return <main className="mx-auto max-w-7xl px-6 py-8">Unable to load calendar data.</main>
  }

  return (
    <main className="mx-auto w-full max-w-7xl px-6 py-8 lg:px-10">
      <CalendarView taskRows={taskRows ?? []} classRows={classRows ?? []} />
    </main>
  )
}