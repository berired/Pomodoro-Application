import { createSupabaseServerClient } from '@/lib/supabaseServer'
import CanvasTodoList from '@/components/CanvasTodoList'
import ClassScheduleGrid from '@/components/ClassScheduleGrid'
import UserTodoList from '@/components/UserTodoList'

export default async function AcademicsPage(): Promise<React.JSX.Element> {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return <main className="mx-auto max-w-7xl px-6 py-8">Unauthorized</main>
  }

  return (
    <main className="mx-auto w-full max-w-7xl px-6 py-8 lg:px-10">
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Left: Class Schedule — full height */}
        <ClassScheduleGrid />

        {/* Right: Canvas on top, Tasks on bottom */}
        <div className="flex flex-col gap-4">
          <CanvasTodoList />
          <UserTodoList />
        </div>
      </div>
    </main>
  )
}
