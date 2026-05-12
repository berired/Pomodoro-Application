'use client'

import Script from 'next/script'
import Image from 'next/image'
import { useEffect, useMemo, useState } from 'react'
import { Pause, Play, SkipBack, SkipForward, Volume2 } from 'lucide-react'
import PlaylistPanel from '@/components/PlaylistPanel'
import { ACCENT_COLOR } from '@/lib/constants'
import type { SpotifyPlaylist, SpotifyTrack } from '@/types'

interface SpotifyPlaybackState {
  is_playing?: boolean
  item?: {
    id: string
    name: string
    duration_ms: number
    artists: Array<{ name: string }>
    album: { images: Array<{ url: string }> }
    uri: string
  } | null
  progress_ms?: number
  device?: { volume_percent?: number }
}

export default function SpotifyPlayer(): React.JSX.Element {
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [playlists, setPlaylists] = useState<SpotifyPlaylist[]>([])
  const [currentPlayback, setCurrentPlayback] = useState<SpotifyPlaybackState | null>(null)
  const [selectedPlaylist, setSelectedPlaylist] = useState<SpotifyPlaylist | null>(null)
  const [volume, setVolume] = useState(50)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const currentTrack = useMemo<SpotifyTrack | null>(() => {
    const playbackItem = currentPlayback?.item
    if (!playbackItem) return null

    return {
      id: playbackItem.id,
      trackName: playbackItem.name,
      artistName: playbackItem.artists.map((artist) => artist.name).join(', '),
      albumArt: playbackItem.album.images[0]?.url ?? '',
      durationMs: playbackItem.duration_ms,
    }
  }, [currentPlayback])

  useEffect(() => {
    async function loadSpotifyData(): Promise<void> {
      try {
        const tokenResponse = await fetch('/api/spotify/token')
        if (!tokenResponse.ok) {
          setIsConnected(false)
          setIsLoading(false)
          return
        }

        setIsConnected(true)
        const [playlistResponse, currentResponse] = await Promise.all([
          fetch('/api/spotify/playlists'),
          fetch('/api/spotify/current'),
        ])

        if (playlistResponse.ok) {
          const playlistData = (await playlistResponse.json()) as SpotifyPlaylist[]
          setPlaylists(playlistData)
        }

        if (currentResponse.ok) {
          const currentData = (await currentResponse.json()) as SpotifyPlaybackState
          setCurrentPlayback(currentData)
          setVolume(currentData.device?.volume_percent ?? 50)
        }
      } catch {
        setErrorMessage('Unable to load Spotify data.')
      } finally {
        setIsLoading(false)
      }
    }

    void loadSpotifyData()
  }, [])

  async function connectSpotify(): Promise<void> {
    window.location.href = '/api/spotify/auth'
  }

  async function sendPlaybackAction(action: 'play' | 'pause' | 'next' | 'previous'): Promise<void> {
    setErrorMessage(null)
    const response = await fetch('/api/spotify/control', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action,
        contextUri: selectedPlaylist ? `spotify:playlist:${selectedPlaylist.id}` : undefined,
      }),
    })

    if (!response.ok) {
      setErrorMessage('Spotify playback request failed.')
      return
    }

    if (action === 'play') {
      const currentResponse = await fetch('/api/spotify/current')
      if (currentResponse.ok) {
        setCurrentPlayback((await currentResponse.json()) as SpotifyPlaybackState)
      }
    }
  }

  async function updateVolume(nextVolume: number): Promise<void> {
    setVolume(nextVolume)
    await fetch('/api/spotify/volume', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ volumePercent: nextVolume }),
    })
  }

  return (
    <section className="rounded-3xl border p-6" style={{ borderColor: ACCENT_COLOR }}>
      <Script src="https://sdk.scdn.co/spotify-player.js" strategy="afterInteractive" />
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-black/60 dark:text-white/60">Spotify</p>
          <h2 className="mt-2 text-2xl font-semibold">Web player</h2>
        </div>
        {!isConnected ? (
          <button type="button" onClick={connectSpotify} className="rounded-full px-4 py-2 text-sm text-white" style={{ backgroundColor: ACCENT_COLOR }}>
            Connect Spotify
          </button>
        ) : (
          <span className="text-sm text-black/60 dark:text-white/60">Connected</span>
        )}
      </div>

      {isLoading ? <p className="mt-6 text-sm text-black/70 dark:text-white/70">Loading Spotify data…</p> : null}
      {errorMessage ? <p className="mt-4 rounded-2xl border px-4 py-3 text-sm" style={{ borderColor: `${ACCENT_COLOR}33` }}>{errorMessage}</p> : null}

      {isConnected ? (
        <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-3xl border p-5" style={{ borderColor: `${ACCENT_COLOR}33` }}>
            {currentTrack ? (
              <>
                <div className="flex gap-4">
                  <div className="relative h-28 w-28 overflow-hidden rounded-2xl bg-black/5 dark:bg-white/5">
                    {currentTrack.albumArt ? <Image src={currentTrack.albumArt} alt={currentTrack.trackName} fill className="object-cover" sizes="112px" /> : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm uppercase tracking-[0.2em] text-black/60 dark:text-white/60">Now playing</p>
                    <h3 className="mt-2 truncate text-2xl font-semibold">{currentTrack.trackName}</h3>
                    <p className="mt-1 text-sm text-black/70 dark:text-white/70">{currentTrack.artistName}</p>
                    <div className="mt-5 h-2 rounded-full bg-black/10 dark:bg-white/10">
                      <div className="h-2 rounded-full" style={{ width: `${currentPlayback?.progress_ms && currentTrack.durationMs ? (currentPlayback.progress_ms / currentTrack.durationMs) * 100 : 0}%`, backgroundColor: ACCENT_COLOR }} />
                    </div>
                    <p className="mt-2 text-xs text-black/60 dark:text-white/60">{currentPlayback?.progress_ms ? `${Math.round((currentPlayback.progress_ms / 1000) / 60)} min elapsed` : 'No current track data'}</p>
                  </div>
                </div>
              </>
            ) : (
              <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-black/70 dark:text-white/70" style={{ borderColor: `${ACCENT_COLOR}33` }}>
                Play something on Spotify to see the current track here.
              </div>
            )}

            <div className="mt-6 flex items-center gap-3">
              <button type="button" aria-label="Previous track" onClick={() => void sendPlaybackAction('previous')} className="rounded-full border p-3" style={{ borderColor: ACCENT_COLOR }}>
                <SkipBack className="h-4 w-4" aria-hidden="true" />
              </button>
              <button type="button" aria-label={currentPlayback?.is_playing ? 'Pause track' : 'Play track'} onClick={() => void sendPlaybackAction(currentPlayback?.is_playing ? 'pause' : 'play')} className="rounded-full px-5 py-3 text-white" style={{ backgroundColor: ACCENT_COLOR }}>
                {currentPlayback?.is_playing ? <Pause className="h-4 w-4" aria-hidden="true" /> : <Play className="h-4 w-4" aria-hidden="true" />}
              </button>
              <button type="button" aria-label="Next track" onClick={() => void sendPlaybackAction('next')} className="rounded-full border p-3" style={{ borderColor: ACCENT_COLOR }}>
                <SkipForward className="h-4 w-4" aria-hidden="true" />
              </button>
              <div className="ml-auto flex items-center gap-3">
                <Volume2 className="h-4 w-4" aria-hidden="true" />
                <input aria-label="Volume" type="range" min={0} max={100} value={volume} onChange={(event) => void updateVolume(Number(event.target.value))} className="w-32 accent-current" style={{ accentColor: ACCENT_COLOR }} />
              </div>
            </div>
          </div>

          <PlaylistPanel playlists={playlists} selectedPlaylistId={selectedPlaylist?.id ?? null} onSelectPlaylist={setSelectedPlaylist} />
        </div>
      ) : (
        <div className="mt-6 rounded-3xl border border-dashed p-8 text-center text-sm text-black/70 dark:text-white/70" style={{ borderColor: `${ACCENT_COLOR}33` }}>
          Connect Spotify to sync playlists and playback controls.
        </div>
      )}
    </section>
  )
}
