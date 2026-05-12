'use client'

import Image from 'next/image'
import { Music3 } from 'lucide-react'
import type { SpotifyPlaylist } from '@/types'
import { ACCENT_COLOR } from '@/lib/constants'

interface PlaylistPanelProps {
  playlists: SpotifyPlaylist[]
  selectedPlaylistId: string | null
  onSelectPlaylist: (playlist: SpotifyPlaylist) => void
}

export default function PlaylistPanel({ playlists, selectedPlaylistId, onSelectPlaylist }: PlaylistPanelProps): React.JSX.Element {
  return (
    <section className="rounded-3xl border p-6" style={{ borderColor: ACCENT_COLOR }}>
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-black/60 dark:text-white/60">Spotify</p>
          <h3 className="mt-2 text-2xl font-semibold">Your playlists</h3>
        </div>
        <Music3 className="h-5 w-5" aria-hidden="true" />
      </div>
      <div className="mt-6 space-y-3">
        {playlists.map((playlist) => {
          const isSelected = playlist.id === selectedPlaylistId
          return (
            <button
              key={playlist.id}
              type="button"
              onClick={() => onSelectPlaylist(playlist)}
              className="flex w-full items-center gap-4 rounded-2xl border p-3 text-left transition-colors hover:bg-black/5 dark:hover:bg-white/5"
              style={{ borderColor: isSelected ? ACCENT_COLOR : `${ACCENT_COLOR}33` }}
            >
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-black/5 dark:bg-white/5">
                {playlist.imageUrl ? (
                  <Image src={playlist.imageUrl} alt={playlist.name} fill className="object-cover" sizes="56px" />
                ) : null}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{playlist.name}</p>
                <p className="text-xs text-black/60 dark:text-white/60">{playlist.trackCount} tracks</p>
              </div>
            </button>
          )
        })}
        {playlists.length === 0 ? <p className="text-sm text-black/70 dark:text-white/70">No playlists were found for this account.</p> : null}
      </div>
    </section>
  )
}
