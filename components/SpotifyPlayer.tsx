'use client'

import Image from 'next/image'
import { ArrowLeft, Music2, Pause, Play, SkipBack, SkipForward, Volume2 } from 'lucide-react'
import { useSpotify } from '@/contexts/SpotifyContext'

function fmtMs(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

export default function SpotifyPlayer(): React.JSX.Element {
  const {
    connected, loading, playerReady, playlists,
    paused, currentTrack, duration, localProgress, volume,
    controlError, needsReconnect,
    openPlaylist, selectedId, tracks, tracksLoading, tracksReason,
    togglePlay, skipNext, skipPrevious, handleVolume,
    playContext, openPlaylistTracks, closePlaylist, disconnect,
  } = useSpotify()

  const progress = duration > 0 ? (localProgress / duration) * 100 : 0
  const sortedPlaylists = [...playlists].sort((a, b) => Number(b.isOwned) - Number(a.isOwned))

  const BAR_W = 20
  const filledBars = Math.min(BAR_W, Math.max(0, Math.round((progress / 100) * BAR_W)))
  const asciiBar = '[' + '█'.repeat(filledBars) + '░'.repeat(BAR_W - filledBars) + ']'

  const controlErrorLabel =
    controlError === 'no_device' ? 'Player is connecting — try again in a moment.' :
    controlError === 'premium_required' ? 'Spotify Premium is required for playback control.' :
    controlError === 'failed' ? 'Playback request failed.' : null

  return (
    <section className="term-window flex flex-col">
      {/* Title bar */}
      <div className="term-titlebar">
        <div className="term-titlebar-dots">
          <span aria-hidden="true" /><span aria-hidden="true" /><span aria-hidden="true" />
        </div>
        <span>SPOTIFY_PLAYER.EXE</span>
        <span className="ml-auto">
          {!connected
            ? 'DISCONNECTED'
            : playerReady
              ? <span style={{ color: 'var(--primary)', textShadow: 'var(--phosphor-glow)' }}>ONLINE</span>
              : 'CONNECTING...'}
        </span>
      </div>

      <div className="flex flex-col gap-4 p-4">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-[10px] text-muted-foreground">
              <span className="text-primary" style={{ textShadow: 'var(--phosphor-glow)' }}>&gt; </span>
              AUDIO MODULE
            </p>
            <h2 className="text-xl">SPOTIFY PLAYER</h2>
          </div>
          {!connected ? (
            <button
              type="button"
              onClick={() => { window.location.href = '/api/spotify/auth' }}
              className="term-btn text-xs"
            >
              [ CONNECT ]
            </button>
          ) : (
            <button
              type="button"
              onClick={disconnect}
              className="term-btn term-btn-danger text-xs"
            >
              [ DISCONNECT ]
            </button>
          )}
        </div>

        {/* Loading */}
        {loading && (
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <div key={i} className="h-10 animate-pulse border border-border bg-muted" />
            ))}
          </div>
        )}

        {/* Not connected */}
        {!loading && !connected && (
          <div className="term-empty">
            Connect your Spotify account to use the web player.
          </div>
        )}

        {/* Connected */}
        {!loading && connected && (
          <>
            {/* Session expired */}
            {needsReconnect && (
              <div className="border border-dashed border-border p-4 text-center">
                <p className="text-xs text-muted-foreground">SESSION EXPIRED — reconnect to continue.</p>
                <div className="mt-3 flex justify-center gap-2">
                  <button type="button" onClick={disconnect} className="term-btn term-btn-ghost text-xs">
                    [ DISCONNECT ]
                  </button>
                  <button type="button" onClick={() => { window.location.href = '/api/spotify/auth' }} className="term-btn text-xs">
                    [ RECONNECT ]
                  </button>
                </div>
              </div>
            )}

            {/* Now playing */}
            {!needsReconnect && (
              <div>
                {currentTrack ? (
                  <div className="flex gap-3">
                    <div className="relative h-14 w-14 shrink-0 overflow-hidden border border-border bg-muted">
                      {currentTrack.album.images[0]?.url && (
                        <Image src={currentTrack.album.images[0].url} alt={currentTrack.name} fill className="object-cover" sizes="56px" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1 self-center">
                      <p className="text-[9px] uppercase tracking-widest text-muted-foreground">NOW PLAYING</p>
                      <p className="mt-0.5 truncate text-sm" style={{ textShadow: 'var(--phosphor-glow)' }}>{currentTrack.name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {currentTrack.artists.map((a) => a.name).join(', ')}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="term-empty">
                    {playerReady ? 'SELECT A PLAYLIST BELOW TO BEGIN' : 'CONNECTING PLAYER...'}
                  </div>
                )}

                {/* ASCII progress bar */}
                <div className="mt-3">
                  <p
                    className="term-progress text-sm"
                    aria-label={`Progress: ${Math.round(progress)}%`}
                    aria-hidden="true"
                  >
                    {asciiBar}
                  </p>
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
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    aria-label="Previous"
                    onClick={() => void skipPrevious()}
                    disabled={!playerReady}
                    className="term-btn term-btn-ghost px-2 py-1"
                  >
                    <SkipBack className="h-3 w-3" />
                  </button>
                  <button
                    type="button"
                    aria-label={paused ? 'Play' : 'Pause'}
                    onClick={() => void togglePlay()}
                    disabled={!playerReady}
                    className="term-btn px-4 py-1"
                  >
                    {paused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
                  </button>
                  <button
                    type="button"
                    aria-label="Next"
                    onClick={() => void skipNext()}
                    disabled={!playerReady}
                    className="term-btn term-btn-ghost px-2 py-1"
                  >
                    <SkipForward className="h-3 w-3" />
                  </button>
                  <div className="ml-auto flex items-center gap-2">
                    <Volume2 className="h-3 w-3 shrink-0 text-muted-foreground" aria-hidden="true" />
                    <input
                      type="range" min={0} max={100} value={volume}
                      onChange={(e) => handleVolume(Number(e.target.value))}
                      aria-label="Volume"
                      className="h-1 w-20 cursor-pointer"
                    />
                  </div>
                </div>
                {controlErrorLabel && (
                  <p className="text-[11px] text-muted-foreground">[WARN] {controlErrorLabel}</p>
                )}
              </>
            )}

            <div className="border-t border-border" />

            {/* Tracks / Playlist view */}
            {openPlaylist ? (
              <>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    aria-label="Back to playlists"
                    onClick={closePlaylist}
                    className="term-btn term-btn-ghost px-2 py-1"
                  >
                    <ArrowLeft className="h-3 w-3" />
                  </button>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs" style={{ textShadow: 'var(--phosphor-glow)' }}>{openPlaylist.name.toUpperCase()}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {tracksLoading ? 'LOADING...' : `${tracks.length} TRACK${tracks.length === 1 ? '' : 'S'}`}
                    </p>
                  </div>
                  {playerReady && (
                    <button
                      type="button"
                      onClick={() => void playContext(`spotify:playlist:${openPlaylist.id}`)}
                      className="term-btn text-xs"
                    >
                      <Play className="h-2.5 w-2.5" /> PLAY
                    </button>
                  )}
                </div>

                <div className="max-h-56 space-y-1 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                  {tracksLoading && [1, 2, 3].map((i) => (
                    <div key={i} className="h-10 animate-pulse border border-border bg-muted" />
                  ))}

                  {!tracksLoading && (tracksReason === 'unauthorized' || tracksReason === 'not_connected') && (
                    <div className="term-empty">
                      <p>SESSION EXPIRED. Reconnect to load tracks.</p>
                      <div className="mt-3 flex justify-center gap-2">
                        <button type="button" onClick={disconnect} className="term-btn term-btn-ghost text-xs">[ DISCONNECT ]</button>
                        <button type="button" onClick={() => { window.location.href = '/api/spotify/auth' }} className="term-btn text-xs">[ RECONNECT ]</button>
                      </div>
                    </div>
                  )}

                  {!tracksLoading && tracksReason === 'inaccessible' && (
                    <p className="text-xs text-muted-foreground">
                      [INFO] Track list unavailable for Spotify-generated playlists. Use PLAY above.
                    </p>
                  )}

                  {!tracksLoading && tracksReason && !['unauthorized', 'not_connected', 'inaccessible'].includes(tracksReason) && (
                    <p className="text-xs text-muted-foreground">[ERR] Could not load tracks. Try again later.</p>
                  )}

                  {!tracksLoading && !tracksReason && tracks.length === 0 && (
                    <p className="text-xs text-muted-foreground">[INFO] This playlist is empty.</p>
                  )}

                  {tracks.map((t, idx) => (
                    <button
                      key={`${t.id}-${idx}`}
                      type="button"
                      onClick={() => void playContext(`spotify:playlist:${openPlaylist.id}`, `spotify:track:${t.id}`)}
                      className="flex w-full items-center gap-3 border border-border px-3 py-2 text-left transition-colors hover:border-primary hover:bg-muted"
                    >
                      <div className="relative h-7 w-7 shrink-0 overflow-hidden border border-border bg-muted">
                        {t.albumArt && <Image src={t.albumArt} alt={t.trackName} fill className="object-cover" sizes="28px" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs">{t.trackName}</p>
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
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground">PLAYLISTS</p>
                  <Music2 className="h-3 w-3 text-muted-foreground" aria-hidden="true" />
                </div>

                <div className="max-h-56 space-y-1 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                  {playlists.length === 0 && (
                    <p className="text-xs text-muted-foreground">[INFO] No playlists found.</p>
                  )}
                  {sortedPlaylists.map((pl) => {
                    const isSelected = pl.id === selectedId
                    return (
                      <button
                        key={pl.id}
                        type="button"
                        onClick={() => void openPlaylistTracks(pl)}
                        className={`flex w-full items-center gap-3 border px-3 py-2 text-left transition-colors hover:border-primary hover:bg-muted ${
                          isSelected ? 'border-primary' : 'border-border'
                        }`}
                      >
                        <div className="relative h-8 w-8 shrink-0 overflow-hidden border border-border bg-muted">
                          {pl.imageUrl && <Image src={pl.imageUrl} alt={pl.name} fill className="object-cover" sizes="32px" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs" style={isSelected ? { textShadow: 'var(--phosphor-glow)' } : {}}>{pl.name}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {pl.trackCount} {pl.trackCount === 1 ? 'TRACK' : 'TRACKS'}
                            {!pl.isOwned && ' · FOLLOWED'}
                          </p>
                        </div>
                        {isSelected && (
                          <span
                            className="shrink-0 text-primary text-xs"
                            style={{ textShadow: 'var(--phosphor-glow)' }}
                            aria-hidden="true"
                          >
                            ◆
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </section>
  )
}
