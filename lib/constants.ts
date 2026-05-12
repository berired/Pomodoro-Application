export const ACCENT_COLOR = '#3A0A4E' as const

export const DAYS_OF_WEEK = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
] as const

export type DayOfWeek = (typeof DAYS_OF_WEEK)[number]

export const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*\d).{8,16}$/
