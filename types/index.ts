export interface UserRow {
  id: string
  name: string
  email: string
  username: string
  password: string
  school: string | null
  canvas_token: string | null
  canvas_domain: string | null
  created_at: string
}

export interface LoginActivityRow {
  id: string
  user_id: string
  login_at: string
}

export interface ClassRow {
  id: string
  user_id: string
  name: string
  start_time: string
  end_time: string
  days: string[]
  room: string
  professor: string | null
  created_at: string
}

export interface TaskRow {
  id: string
  user_id: string
  title: string
  date: string
  start_time: string | null
  end_time: string | null
  all_day: boolean
  completed: boolean
  created_at: string
}

export interface SpotifyTokenRow {
  id: string
  user_id: string
  access_token: string
  refresh_token: string
  expires_at: string
}

export interface HeatmapEntry {
  date: string // 'YYYY-MM-DD'
  count: number
}

export interface SpotifyPlaylist {
  id: string
  name: string
  imageUrl: string
  trackCount: number
  isOwned: boolean
}

export interface SpotifyTrack {
  id: string
  trackName: string
  artistName: string
  albumArt: string
  durationMs: number
}

export interface CanvasAssignment {
  id: number
  title: string
  courseName: string
  dueAt: string | null
}

export type CreateClassPayload = Omit<ClassRow, 'id' | 'user_id' | 'created_at'>
export type UpdateClassPayload = Partial<CreateClassPayload>
export type CreateTaskPayload = Omit<TaskRow, 'id' | 'user_id' | 'created_at' | 'completed'>
export type UpdateTaskPayload = Partial<CreateTaskPayload & { completed: boolean }>
