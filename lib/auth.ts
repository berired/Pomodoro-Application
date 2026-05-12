import 'server-only'
import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { supabaseAdmin } from '@/lib/supabase'

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        identifier: { label: 'Username or Email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const identifier = credentials?.identifier as string
        const password = credentials?.password as string

        const { data: userRow } = await supabaseAdmin
          .from('users')
          .select('id, name, email, username, password')
          .or(`email.eq.${identifier},username.eq.${identifier}`)
          .maybeSingle()

        if (!userRow) return null

        const passwordMatch = await bcrypt.compare(password, userRow.password)
        if (!passwordMatch) return null

        const { error: loginActivityError } = await supabaseAdmin
          .from('login_activity')
          .insert({ user_id: userRow.id })

        if (loginActivityError) {
          console.warn('Failed to record login activity:', loginActivityError.message)
        }

        return {
          id: userRow.id,
          name: userRow.name,
          email: userRow.email,
          username: userRow.username,
        }
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.username = (user as { username: string }).username
      }
      return token
    },
    session({ session, token }) {
      session.user.id = token.id as string
      session.user.username = token.username as string
      return session
    },
  },
  pages: { signIn: '/login' },
})
