'use client'

import { useRef, useState } from 'react'
import { Music, Plus, X, GripVertical } from 'lucide-react'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import SongPicker from '@/components/room/SongPicker'
import { getSourceBadge } from '@/lib/track-utils'
import type { TrackInfo } from '@/types'

const MAX_SONGS = 3

interface MyQueuePanelProps {
  songs: TrackInfo[]
  isPlaying: boolean   // true when this DJ is the active DJ
  onUpdate: (songs: TrackInfo[]) => Promise<void>
}

export default function MyQueuePanel({ songs, isPlaying, onUpdate }: MyQueuePanelProps) {
  const [showPicker, setShowPicker] = useState(false)
  const [saving, setSaving] = useState(false)

  // Drag state
  const dragIdx = useRef<number | null>(null)
  const dragOverIdx = useRef<number | null>(null)

  async function addSong(track: TrackInfo) {
    if (songs.length >= MAX_SONGS) return
    const next = [...songs, track]
    setSaving(true)
    await onUpdate(next)
    setSaving(false)
    setShowPicker(false)
  }

  async function removeSong(idx: number) {
    const next = songs.filter((_, i) => i !== idx)
    setSaving(true)
    await onUpdate(next)
    setSaving(false)
  }

  function onDragStart(idx: number) {
    dragIdx.current = idx
  }

  function onDragEnter(idx: number) {
    dragOverIdx.current = idx
  }

  async function onDragEnd() {
    const from = dragIdx.current
    const to = dragOverIdx.current
    dragIdx.current = null
    dragOverIdx.current = null
    if (from === null || to === null || from === to) return

    const next = [...songs]
    const [moved] = next.splice(from, 1)
    next.splice(to, 0, moved)
    setSaving(true)
    await onUpdate(next)
    setSaving(false)
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wide flex items-center gap-1.5">
          <Music size={12} />
          My Queue {saving && <span className="text-text-muted font-normal">Saving…</span>}
        </h3>
        {songs.length < MAX_SONGS && (
          <button
            onClick={() => setShowPicker(true)}
            className="flex items-center gap-1 text-xs text-accent-purple hover:text-accent-pink transition-colors"
          >
            <Plus size={12} /> Add Song
          </button>
        )}
      </div>

      {songs.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-4 text-center">
          <p className="text-xs text-text-muted">No songs queued</p>
          <Button size="sm" variant="secondary" onClick={() => setShowPicker(true)}>
            <Plus size={14} /> Add Song
          </Button>
        </div>
      ) : (
        <ol className="flex flex-col gap-1">
          {songs.map((track, idx) => {
            const badge = getSourceBadge(track.source)
            const isActive = isPlaying && idx === 0
            return (
              <li
                key={idx}
                draggable
                onDragStart={() => onDragStart(idx)}
                onDragEnter={() => onDragEnter(idx)}
                onDragEnd={onDragEnd}
                onDragOver={(e) => e.preventDefault()}
                className={`flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-grab active:cursor-grabbing ${
                  isActive
                    ? 'bg-accent-purple/15 border-accent-purple/40'
                    : 'bg-bg-secondary border-border hover:border-border-bright'
                }`}
              >
                <GripVertical size={14} className="text-text-muted flex-shrink-0" />
                <span className="text-sm flex-shrink-0">{badge.emoji}</span>
                <span className="text-sm text-text-primary truncate flex-1 min-w-0">
                  {track.title}
                </span>
                {isActive && (
                  <span className="text-[10px] text-accent-purple font-semibold flex-shrink-0 animate-pulse">
                    ▶ NOW
                  </span>
                )}
                <button
                  onClick={() => removeSong(idx)}
                  className="text-text-muted hover:text-accent-red transition-colors flex-shrink-0"
                >
                  <X size={13} />
                </button>
              </li>
            )
          })}
        </ol>
      )}

      <Modal isOpen={showPicker} onClose={() => setShowPicker(false)} title="Add Song to Queue">
        <SongPicker
          onPlay={addSong}
          onCancel={() => setShowPicker(false)}
        />
      </Modal>
    </div>
  )
}
