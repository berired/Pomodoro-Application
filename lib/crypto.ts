import 'server-only'
import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto'

const ALGORITHM = 'aes-256-gcm'

// Derive a consistent 32-byte key from any secret string via SHA-256.
// This means CANVAS_TOKEN_SECRET can be any value — no strict hex format required.
function deriveKey(): Buffer {
  const secret = process.env.CANVAS_TOKEN_SECRET
  if (!secret) throw new Error('CANVAS_TOKEN_SECRET env var is not set')
  return createHash('sha256').update(secret).digest()
}

const SECRET_KEY = deriveKey()

export function encryptToken(plaintext: string): string {
  const iv = randomBytes(12)
  const cipher = createCipheriv(ALGORITHM, SECRET_KEY, iv)
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const authTag = cipher.getAuthTag()
  return [iv.toString('hex'), authTag.toString('hex'), encrypted.toString('hex')].join(':')
}

export function decryptToken(ciphertext: string): string {
  const [ivHex, authTagHex, encryptedHex] = ciphertext.split(':')
  const iv = Buffer.from(ivHex, 'hex')
  const authTag = Buffer.from(authTagHex, 'hex')
  const encrypted = Buffer.from(encryptedHex, 'hex')
  const decipher = createDecipheriv(ALGORITHM, SECRET_KEY, iv)
  decipher.setAuthTag(authTag)
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8')
}
