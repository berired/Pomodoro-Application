import 'server-only'
import { createHmac } from 'crypto'

const STATE_SECRET = process.env.CANVAS_TOKEN_SECRET ?? 'spotify-state-secret'

export function signState(nonce: string, userId: string): string {
  return createHmac('sha256', STATE_SECRET).update(`${nonce}:${userId}`).digest('hex').slice(0, 16)
}
