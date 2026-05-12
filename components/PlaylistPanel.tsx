'use client'

import Image from 'next/image'
import { Music3 } from 'lucide-react'
import type { SpotifyPlaylist } from '@/types'

interface PlaylistPanelProps {
  playlists: SpotifyPlaylist[]
  selectedPlaylistId: string | null
  onSelectPlaylist: (playlist: SpotifyPlaylist) => void
}

export default function PlaylistPanel({ playlists, selectedPlaylistId, onSelectPlaylist }: PlaylistPanelProps): React.JSX.Element {
  return (
    <section className="rounded-3xl border border-primary p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Spotify</p>
          <h3 className="mt-2 text-2xl font-semibold">Your playlists</h3>
        </div>
        <Music3 className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
      </div>
      <div className="mt-6 space-y-3">
        {playlists.map((playlist) => {
          const isSelected = playlist.id === selectedPlaylistId
          return (
            <button
              key={playlist.id}
              type="button"
              onClick={() => onSelectPlaylist(playlist)}
              className={`flex w-full items-center gap-4 rounded-2xl border p-3 text-left transition-colors hover:bg-primary/8 ${
                isSelected ? 'border-primary' : 'border-primary/20'
              }`}
            >
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-muted">
                {playlist.imageUrl ? (
                  <Image src={playlist.imageUrl} alt={playlist.name} fill className="object-cover" sizes="56px" />
                ) : null}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{playlist.name}</p>
                <p className="text-xs text-muted-foreground">{playlist.trackCount} tracks</p>
              </div>
            </button>
          )
        })}
        {playlists.length === 0 ? (
          <p className="text-sm text-muted-foreground">No playlists were found for this account.</p>
        ) : null}
      </div>
    </section>
  )
}
