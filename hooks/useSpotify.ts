import { useCallback, useEffect, useState } from 'react'
import type { SpotifyPlaylist } from '@/types'

export function useSpotify() {
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [playlists, setPlaylists] = useState<SpotifyPlaylist[]>([])
  const [error, setError] = useState<string | null>(null)

  const fetchPlaylists = useCallback(async (): Promise<void> => {
    try {
      const res = await fetch('/api/spotify/playlists')
      if (!res.ok) throw new Error('Failed to fetch playlists')
      const data = await res.json()
      setPlaylists(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    }
  }, [])

  const checkConnection = useCallback(async (): Promise<void> => {
    try {
      const res = await fetch('/api/spotify/token')
      if (res.ok) {
        setIsConnected(true)
        await fetchPlaylists()
      } else {
        setIsConnected(false)
      }
    } catch {
      setIsConnected(false)
    } finally {
      setIsLoading(false)
    }
  }, [fetchPlaylists])

  useEffect(() => {
    void checkConnection()
  }, [checkConnection])

  function connectSpotify(): void {
    window.location.href = '/api/spotify/auth'
  }

  return {
    isConnected,
    isLoading,
    playlists,
    error,
    checkConnection,
    fetchPlaylists,
    connectSpotify,
  }
}
