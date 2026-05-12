import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { supabaseAdmin } from '@/lib/supabase'
import CalendarView from '@/components/CalendarView'

export default async function CalendarPage(): Promise<React.JSX.Element> {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return <main className="mx-auto max-w-7xl px-6 py-8">Unauthorized</main>
  }

  const { data: taskRows, error: taskError } = await supabaseAdmin
    .from('tasks')
    .select('*')
    .eq('user_id', user.id)
    .order('date', { ascending: true })

  if (taskError) {
    return <main className="mx-auto max-w-7xl px-6 py-8">Unable to load calendar data.</main>
  }

  return (
    <main className="mx-auto w-full max-w-7xl px-6 py-8 lg:px-10">
      <CalendarView taskRows={taskRows ?? []} />
    </main>
  )
}
