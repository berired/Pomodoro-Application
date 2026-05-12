'use client'

import Image from 'next/image'
import { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowLeft, Music2, Pause, Play, SkipBack, SkipForward, Volume2 } from 'lucide-react'
import type { SpotifyPlaylist, SpotifyTrack } from '@/types'

// ── Spotify Web Playback SDK minimal types ──────────────────────────────────
interface SDKTrack {
  id: string
  name: string
  duration_ms: number
  artists: Array<{ name: string }>
  album: { images: Array<{ url: string }> }
}

interface SDKState {
  paused: boolean
  position: number
  duration: number
  timestamp: number
  track_window: { current_track: SDKTrack | null }
}

interface SDKPlayer {
  connect(): Promise<boolean>
  disconnect(): void
  pause(): Promise<void>
  resume(): Promise<void>
  togglePlay(): Promise<void>
  nextTrack(): Promise<void>
  previousTrack(): Promise<void>
  setVolume(v: number): Promise<void>
  getVolume(): Promise<number>
  getCurrentState(): Promise<SDKState | null>
  addListener(event: string, cb: (data: unknown) => void): boolean
  removeListener(event: string, cb?: (data: unknown) => void): boolean
}

declare global {
  interface Window {
    Spotify: { Player: new (opts: { name: string; getOAuthToken: (cb: (t: string) => void) => void; volume: number }) => SDKPlayer }
    onSpotifyWebPlaybackSDKReady: () => void
  }
}
// ───────────────────────────────────────────────────────────────────────────

function fmtMs(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

export default function SpotifyPlayer(): React.JSX.Element {
  const [connected, setConnected] = useState(false)
  const [loading, setLoading] = useState(true)
  const [playerReady, setPlayerReady] = useState(false)
  const [playlists, setPlaylists] = useState<SpotifyPlaylist[]>([])

  const [paused, setPaused] = useState(true)
  const [currentTrack, setCurrentTrack] = useState<SDKTrack | null>(null)
  const [duration, setDuration] = useState(0)
  const [localProgress, setLocalProgress] = useState(0)
  const [volume, setVolume] = useState(50)

  const [controlError, setControlError] = useState<string | null>(null)
  const [needsReconnect, setNeedsReconnect] = useState(false)

  const [openPlaylist, setOpenPlaylist] = useState<SpotifyPlaylist | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [tracks, setTracks] = useState<SpotifyTrack[]>([])
  const [tracksLoading, setTracksLoading] = useState(false)
  const [tracksReason, setTracksReason] = useState<string | null>(null)

  const playerRef = useRef<SDKPlayer | null>(null)
  const deviceIdRef = useRef<string | null>(null)
  const tokenRef = useRef<string | null>(null)
  const stateSnapshotRef = useRef<{ position: number; timestamp: number; paused: boolean } | null>(null)

  // ── Token helper ─────────────────────────────────────────────────────────
  const fetchToken = useCallback(async (): Promise<string | null> => {
    try {
      const res = await fetch('/api/spotify/token')
      const data = (await res.json()) as { connected: boolean; accessToken?: string }
      if (!data.connected || !data.accessToken) return null
      tokenRef.current = data.accessToken
      return data.accessToken
    } catch {
      return null
    }
  }, [])

  // ── SDK state handler ────────────────────────────────────────────────────
  const handleSDKState = useCallback((state: SDKState | null) => {
    if (!state) return
    const track = state.track_window.current_track
    setPaused(state.paused)
    setLocalProgress(state.position)
    stateSnapshotRef.current = { position: state.position, timestamp: state.timestamp, paused: state.paused }
    if (track) {
      setCurrentTrack(track)
      setDuration(track.duration_ms || state.duration)
    }
  }, [])

  // ── SDK initialisation ───────────────────────────────────────────────────
  const initSDK = useCallback(() => {
    const createPlayer = () => {
      if (!window.Spotify) return
      const player = new window.Spotify.Player({
        name: 'Pomodoro Web Player',
        getOAuthToken: (cb) => {
          void fetchToken().then((t) => { if (t) cb(t) })
        },
        volume: 0.5,
      })

      player.addListener('ready', ((({ device_id }: { device_id: string }) => {
        deviceIdRef.current = device_id
        setPlayerReady(true)
        void player.getVolume().then((v) => setVolume(Math.round(v * 100)))
      }) as (d: unknown) => void))

      player.addListener('not_ready', (() => {
        setPlayerReady(false)
      }) as (d: unknown) => void)

      player.addListener('player_state_changed', ((state: SDKState | null) => {
        handleSDKState(state)
      }) as (d: unknown) => void)

      player.addListener('authentication_error', (() => {
        setNeedsReconnect(true)
      }) as (d: unknown) => void)

      void player.connect()
      playerRef.current = player
    }

    if (typeof window !== 'undefined' && window.Spotify) {
      createPlayer()
    } else {
      window.onSpotifyWebPlaybackSDKReady = createPlayer
      if (!document.querySelector('script[src*="spotify-player"]')) {
        const s = document.createElement('script')
        s.src = 'https://sdk.scdn.co/spotify-player.js'
        s.async = true
        document.head.appendChild(s)
      }
    }
  }, [fetchToken, handleSDKState])

  // ── Mount: check connection, load playlists, init SDK ───────────────────
  useEffect(() => {
    let cancelled = false
    async function init() {
      try {
        const token = await fetchToken()
        if (cancelled || !token) return
        setConnected(true)
        const plRes = await fetch('/api/spotify/playlists')
        if (!cancelled && plRes.ok) setPlaylists((await plRes.json()) as SpotifyPlaylist[])
        initSDK()
      } catch {
        // ignore
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void init()
    return () => {
      cancelled = true
      playerRef.current?.disconnect()
      playerRef.current = null
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Local progress interpolation ─────────────────────────────────────────
  useEffect(() => {
    if (paused) return
    const id = setInterval(() => {
      const snap = stateSnapshotRef.current
      if (!snap || snap.paused) return
      const elapsed = Date.now() - snap.timestamp
      setLocalProgress(Math.min(snap.position + elapsed, duration || Infinity))
    }, 500)
    return () => clearInterval(id)
  }, [paused, duration])

  // ── Spotify Web API direct call ──────────────────────────────────────────
  async function callSpotify(endpoint: string, method: string, body?: object): Promise<Response | null> {
    const token = await fetchToken()
    if (!token) { setNeedsReconnect(true); return null }
    const deviceId = deviceIdRef.current
    const url = deviceId && endpoint.includes('/play')
      ? `${endpoint}?device_id=${deviceId}`
      : endpoint
    return fetch(url, {
      method,
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    })
  }

  async function playContext(contextUri: string, offsetUri?: string): Promise<void> {
    setControlError(null)
    if (!playerReady) { setControlError('no_device'); return }
    const body: Record<string, unknown> = { context_uri: contextUri }
    if (offsetUri) body.offset = { uri: offsetUri }
    const res = await callSpotify('https://api.spotify.com/v1/me/player/play', 'PUT', body)
    if (!res) return
    if (res.status === 403) setControlError('premium_required')
    else if (!res.ok && res.status !== 204) setControlError('failed')
  }

  async function togglePlay(): Promise<void> {
    setControlError(null)
    if (!playerRef.current) { setControlError('no_device'); return }
    await playerRef.current.togglePlay()
  }

  async function skipNext(): Promise<void> {
    setControlError(null)
    if (!playerRef.current) return
    await playerRef.current.nextTrack()
  }

  async function skipPrevious(): Promise<void> {
    setControlError(null)
    if (!playerRef.current) return
    await playerRef.current.previousTrack()
  }

  const volumeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  function handleVolume(v: number): void {
    setVolume(v)
    if (volumeTimer.current) clearTimeout(volumeTimer.current)
    volumeTimer.current = setTimeout(() => {
      void playerRef.current?.setVolume(v / 100)
    }, 150)
  }

  // ── Playlist tracks ──────────────────────────────────────────────────────
  async function openPlaylistTracks(pl: SpotifyPlaylist): Promise<void> {
    setOpenPlaylist(pl)
    setSelectedId(pl.id)
    setTracks([])
    setTracksReason(null)
    setTracksLoading(true)
    try {
      const res = await fetch(`/api/spotify/playlists/${pl.id}`)
      const data = (await res.json()) as { tracks: SpotifyTrack[]; reason?: string }
      setTracks(data.tracks ?? [])
      if (data.reason) setTracksReason(data.reason)
    } catch {
      setTracksReason('failed')
    } finally {
      setTracksLoading(false)
    }
  }

  // ── Disconnect ───────────────────────────────────────────────────────────
  function disconnect(): void {
    void fetch('/api/spotify/disconnect', { method: 'POST' })
    playerRef.current?.disconnect()
    playerRef.current = null
    deviceIdRef.current = null
    tokenRef.current = null
    stateSnapshotRef.current = null
    setConnected(false)
    setPlayerReady(false)
    setPaused(true)
    setCurrentTrack(null)
    setDuration(0)
    setLocalProgress(0)
    setVolume(50)
    setPlaylists([])
    setOpenPlaylist(null)
    setSelectedId(null)
    setTracks([])
    setTracksReason(null)
    setControlError(null)
    setNeedsReconnect(false)
  }

  // ── Derived ──────────────────────────────────────────────────────────────
  const progress = duration > 0 ? (localProgress / duration) * 100 : 0
  const sortedPlaylists = [...playlists].sort((a, b) => Number(b.isOwned) - Number(a.isOwned))

  const controlErrorLabel =
    controlError === 'no_device' ? 'Player is connecting — try again in a moment.' :
    controlError === 'premium_required' ? 'Spotify Premium is required for playback control.' :
    controlError === 'failed' ? 'Playback request failed.' : null

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <section className="flex flex-col rounded-3xl border border-primary p-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Spotify</p>
          <h2 className="mt-0.5 text-xl font-semibold">Web Player</h2>
        </div>
        {!connected ? (
          <button
            type="button"
            onClick={() => { window.location.href = '/api/spotify/auth' }}
            className="rounded-full bg-primary px-4 py-2 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            Connect Spotify
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500" aria-hidden="true" />
              {playerReady ? 'Connected' : 'Connecting…'}
            </span>
            <button
              type="button"
              onClick={disconnect}
              className="rounded-full border border-border px-2.5 py-1 text-[10px] font-medium text-muted-foreground transition-colors hover:border-destructive hover:text-destructive"
            >
              Disconnect
            </button>
          </div>
        )}
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div className="mt-5 space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-12 animate-pulse rounded-2xl bg-primary/10" />
          ))}
        </div>
      )}

      {/* Not connected */}
      {!loading && !connected && (
        <div className="mt-5 rounded-2xl border border-dashed border-primary/30 p-6 text-center text-sm text-muted-foreground">
          Connect your Spotify account to use the web player.
        </div>
      )}

      {/* Connected */}
      {!loading && connected && (
        <>
          {/* Session expired */}
          {needsReconnect && (
            <div className="mt-4 rounded-2xl border border-dashed border-primary/30 p-4 text-center">
              <p className="text-xs text-muted-foreground">Your Spotify session expired.</p>
              <div className="mt-3 flex justify-center gap-2">
                <button type="button" onClick={disconnect}
                  className="rounded-full border border-border px-3 py-1.5 text-[10px] font-medium text-muted-foreground transition-colors hover:border-primary">
                  Disconnect
                </button>
                <button type="button" onClick={() => { window.location.href = '/api/spotify/auth' }}
                  className="rounded-full bg-primary px-3 py-1.5 text-[10px] font-medium text-primary-foreground transition-opacity hover:opacity-90">
                  Reconnect
                </button>
              </div>
            </div>
          )}

          {/* Now playing */}
          {!needsReconnect && (
            <div className="mt-4">
              {currentTrack ? (
                <div className="flex gap-3">
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-muted">
                    {currentTrack.album.images[0]?.url && (
                      <Image src={currentTrack.album.images[0].url} alt={currentTrack.name} fill className="object-cover" sizes="64px" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1 self-center">
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Now playing</p>
                    <p className="mt-0.5 truncate text-sm font-semibold leading-tight">{currentTrack.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {currentTrack.artists.map((a) => a.name).join(', ')}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-primary/20 px-4 py-5 text-center text-xs text-muted-foreground">
                  {playerReady ? 'Play a playlist below to start listening' : 'Connecting player…'}
                </div>
              )}

              {/* Progress bar */}
              <div className="mt-3">
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-foreground/10">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-500 ease-linear"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
                  <span>{fmtMs(localProgress)}</span>
                  <span>{fmtMs(duration)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Controls */}
          {!needsReconnect && (
            <>
              <div className="mt-3 flex items-center gap-2">
                <button type="button" aria-label="Previous" onClick={() => void skipPrevious()}
                  className="rounded-full border border-primary/40 p-2.5 transition-colors hover:bg-primary/10 disabled:opacity-40"
                  disabled={!playerReady}>
                  <SkipBack className="h-3.5 w-3.5" />
                </button>
                <button type="button" aria-label={paused ? 'Play' : 'Pause'}
                  onClick={() => void togglePlay()}
                  className="rounded-full bg-primary p-3 text-primary-foreground shadow-sm transition-opacity hover:opacity-90 disabled:opacity-40"
                  disabled={!playerReady}>
                  {paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                </button>
                <button type="button" aria-label="Next" onClick={() => void skipNext()}
                  className="rounded-full border border-primary/40 p-2.5 transition-colors hover:bg-primary/10 disabled:opacity-40"
                  disabled={!playerReady}>
                  <SkipForward className="h-3.5 w-3.5" />
                </button>
                <div className="ml-auto flex items-center gap-2">
                  <Volume2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
                  <input
                    type="range" min={0} max={100} value={volume}
                    onChange={(e) => handleVolume(Number(e.target.value))}
                    aria-label="Volume"
                    className="h-1 w-20 cursor-pointer appearance-none rounded-full bg-foreground/10 accent-primary"
                  />
                </div>
              </div>
              {controlErrorLabel && (
                <p className="mt-2 text-[11px] text-muted-foreground">{controlErrorLabel}</p>
              )}
            </>
          )}

          {/* Divider */}
          <div className="my-4 border-t border-border" />

          {/* Tracks view */}
          {openPlaylist ? (
            <>
              <div className="flex items-center gap-2">
                <button type="button" aria-label="Back"
                  onClick={() => { setOpenPlaylist(null); setSelectedId(null); setTracks([]); setTracksReason(null) }}
                  className="rounded-full border border-primary/40 p-1.5 transition-colors hover:bg-primary/10">
                  <ArrowLeft className="h-3 w-3" />
                </button>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold">{openPlaylist.name}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {tracksLoading ? 'Loading…' : `${tracks.length} track${tracks.length === 1 ? '' : 's'}`}
                  </p>
                </div>
                {playerReady && (
                  <button type="button"
                    onClick={() => void playContext(`spotify:playlist:${openPlaylist.id}`)}
                    className="flex shrink-0 items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-[10px] font-medium text-primary-foreground transition-opacity hover:opacity-90">
                    <Play className="h-2.5 w-2.5" />
                    Play
                  </button>
                )}
              </div>

              <div className="mt-3 max-h-64 space-y-1.5 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                {tracksLoading && [1, 2, 3].map((i) => (
                  <div key={i} className="h-11 animate-pulse rounded-xl bg-primary/8" />
                ))}

                {!tracksLoading && (tracksReason === 'unauthorized' || tracksReason === 'not_connected') && (
                  <div className="rounded-xl border border-dashed border-primary/30 p-4 text-center">
                    <p className="text-xs text-muted-foreground">Session expired. Reconnect to load tracks.</p>
                    <div className="mt-3 flex justify-center gap-2">
                      <button type="button" onClick={disconnect}
                        className="rounded-full border border-border px-3 py-1.5 text-[10px] font-medium text-muted-foreground">
                        Disconnect
                      </button>
                      <button type="button" onClick={() => { window.location.href = '/api/spotify/auth' }}
                        className="rounded-full bg-primary px-3 py-1.5 text-[10px] font-medium text-primary-foreground transition-opacity hover:opacity-90">
                        Reconnect
                      </button>
                    </div>
                  </div>
                )}

                {!tracksLoading && tracksReason === 'inaccessible' && (
                  <p className="text-xs text-muted-foreground">
                    Track listing is unavailable for this playlist — it may be a Spotify-generated playlist (Daily Mix, Discover Weekly, etc.). You can still play it using the Play button above.
                  </p>
                )}

                {!tracksLoading && tracksReason && tracksReason !== 'unauthorized' && tracksReason !== 'not_connected' && tracksReason !== 'inaccessible' && (
                  <p className="text-xs text-muted-foreground">Could not load tracks. Try again later.</p>
                )}

                {!tracksLoading && !tracksReason && tracks.length === 0 && (
                  <p className="text-xs text-muted-foreground">This playlist is empty.</p>
                )}

                {tracks.map((t, idx) => (
                  <button key={`${t.id}-${idx}`} type="button"
                    onClick={() => void playContext(`spotify:playlist:${openPlaylist.id}`, `spotify:track:${t.id}`)}
                    className="flex w-full items-center gap-3 rounded-xl border border-primary/15 px-3 py-2 text-left transition-colors hover:bg-primary/8">
                    <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-lg bg-muted">
                      {t.albumArt && <Image src={t.albumArt} alt={t.trackName} fill className="object-cover" sizes="32px" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold">{t.trackName}</p>
                      <p className="truncate text-[10px] text-muted-foreground">{t.artistName}</p>
                    </div>
                    <span className="shrink-0 text-[10px] text-muted-foreground">{fmtMs(t.durationMs)}</span>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Playlists</p>
                <Music2 className="h-3.5 w-3.5 text-muted-foreground/60" aria-hidden="true" />
              </div>

              <div className="mt-3 max-h-64 space-y-2 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                {playlists.length === 0 && (
                  <p className="text-xs text-muted-foreground">No playlists found.</p>
                )}
                {sortedPlaylists.map((pl) => {
                  const isSelected = pl.id === selectedId
                  return (
                    <button key={pl.id} type="button"
                      onClick={() => void openPlaylistTracks(pl)}
                      className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2 text-left transition-colors hover:bg-primary/8 ${isSelected ? 'border-primary' : 'border-primary/20'}`}>
                      <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-lg bg-muted">
                        {pl.imageUrl && <Image src={pl.imageUrl} alt={pl.name} fill className="object-cover" sizes="36px" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-semibold">{pl.name}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {pl.trackCount} {pl.trackCount === 1 ? 'track' : 'tracks'}
                          {!pl.isOwned && ' · followed'}
                        </p>
                      </div>
                      {isSelected && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden="true" />}
                    </button>
                  )
                })}
              </div>
            </>
          )}
        </>
      )}
    </section>
  )
}
