'use client'

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
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

export interface SpotifyContextValue {
  connected: boolean
  loading: boolean
  playerReady: boolean
  playlists: SpotifyPlaylist[]
  paused: boolean
  currentTrack: SDKTrack | null
  duration: number
  localProgress: number
  volume: number
  controlError: string | null
  needsReconnect: boolean
  openPlaylist: SpotifyPlaylist | null
  selectedId: string | null
  tracks: SpotifyTrack[]
  tracksLoading: boolean
  tracksReason: string | null
  togglePlay(): Promise<void>
  skipNext(): Promise<void>
  skipPrevious(): Promise<void>
  handleVolume(v: number): void
  playContext(contextUri: string, offsetUri?: string): Promise<void>
  openPlaylistTracks(pl: SpotifyPlaylist): Promise<void>
  closePlaylist(): void
  disconnect(): void
}

const SpotifyContext = createContext<SpotifyContextValue | null>(null)

export function useSpotify(): SpotifyContextValue {
  const ctx = useContext(SpotifyContext)
  if (!ctx) throw new Error('useSpotify must be used inside SpotifyProvider')
  return ctx
}

export function SpotifyProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
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
  const volumeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

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

  // Init on mount — never re-runs, player lives for the app lifetime
  useEffect(() => {
    async function init() {
      try {
        const token = await fetchToken()
        if (!token) return
        setConnected(true)
        const plRes = await fetch('/api/spotify/playlists')
        if (plRes.ok) setPlaylists((await plRes.json()) as SpotifyPlaylist[])
        initSDK()
      } catch {
        // ignore
      } finally {
        setLoading(false)
      }
    }
    void init()
    // intentional: only run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Local progress interpolation
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

  function handleVolume(v: number): void {
    setVolume(v)
    if (volumeTimer.current) clearTimeout(volumeTimer.current)
    volumeTimer.current = setTimeout(() => {
      void playerRef.current?.setVolume(v / 100)
    }, 150)
  }

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

  function closePlaylist(): void {
    setOpenPlaylist(null)
    setSelectedId(null)
    setTracks([])
    setTracksReason(null)
  }

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

  const value: SpotifyContextValue = {
    connected, loading, playerReady, playlists,
    paused, currentTrack, duration, localProgress, volume,
    controlError, needsReconnect,
    openPlaylist, selectedId, tracks, tracksLoading, tracksReason,
    togglePlay, skipNext, skipPrevious, handleVolume,
    playContext, openPlaylistTracks, closePlaylist, disconnect,
  }

  return <SpotifyContext.Provider value={value}>{children}</SpotifyContext.Provider>
}
