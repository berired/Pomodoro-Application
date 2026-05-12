import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import ProfileSettings from '@/components/ProfileSettings'

export default async function ProfilePage(): Promise<React.JSX.Element> {
  const authSession = await auth()

  if (!authSession?.user?.id) {
    return <main className="mx-auto max-w-7xl px-6 py-8">Unauthorized</main>
  }

  const { data: userRow } = await supabaseAdmin
    .from('users')
    .select('name, username, email, school, canvas_domain, created_at')
    .eq('id', authSession.user.id)
    .maybeSingle()

  const profileRow = userRow as {
    name: string
    username: string
    email: string
    school: string | null
    canvas_domain: string | null
    created_at: string
  } | null

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-8 lg:px-10">
      <section className="rounded-3xl border p-6" style={{ borderColor: '#3A0A4E' }}>
        <h1 className="text-3xl font-semibold">Profile</h1>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-sm text-black/70 dark:text-white/70">Name</p>
            <p className="mt-1 text-lg font-medium">{profileRow?.name ?? authSession.user.name ?? 'Student'}</p>
          </div>
          <div>
            <p className="text-sm text-black/70 dark:text-white/70">Username</p>
            <p className="mt-1 text-lg font-medium">{profileRow?.username ?? authSession.user.username}</p>
          </div>
          <div>
            <p className="text-sm text-black/70 dark:text-white/70">Email</p>
            <p className="mt-1 text-lg font-medium">{profileRow?.email ?? authSession.user.email}</p>
          </div>
          <div>
            <p className="text-sm text-black/70 dark:text-white/70">School</p>
            <p className="mt-1 text-lg font-medium">{profileRow?.school ?? 'Not set'}</p>
          </div>
        </div>
      </section>
      <div className="mt-6">
        <ProfileSettings
          initialProfile={{
            name: profileRow?.name ?? authSession.user.name ?? 'Student',
            username: profileRow?.username ?? authSession.user.username,
            email: profileRow?.email ?? authSession.user.email,
            school: profileRow?.school ?? null,
            canvas_domain: profileRow?.canvas_domain ?? null,
            created_at: profileRow?.created_at ?? '',
          }}
        />
      </div>
    </main>
  )
}