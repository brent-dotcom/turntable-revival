'use client'

import { createClient } from '@/lib/supabase/client'
import type {
  DJQueueEntry,
  Profile,
  Room,
  RoomMember,
  TrackInfo,
  Vote,
  VoteCounts,
  VoteType,
} from '@/types'
import { getElapsedSeconds } from '@/lib/utils'
import { useCallback, useEffect, useRef, useState } from 'react'

interface UseRoomReturn {
  room: Room | null
  members: (RoomMember & { profile: Profile })[]
  queue: (DJQueueEntry & { profile: Profile })[]
  votes: Vote[]
  currentDJProfile: Profile | null
  currentUserProfile: Profile | null
  voteCounts: VoteCounts
  isLoading: boolean
  error: string | null
  currentUserId: string | null
  currentUserIsOwner: boolean
  currentUserIsAdmin: boolean
  playbackElapsed: number
  // Actions
  joinQueue: () => Promise<void>
  leaveQueue: () => Promise<void>
  playSong: (track: TrackInfo) => Promise<void>
  skipSong: () => Promise<void>
  castVote: (type: VoteType) => Promise<void>
  removeFromQueue: (userId: string) => Promise<void>
  updateDJSongs: (songs: TrackInfo[]) => Promise<void>
  deleteRoom: () => Promise<void>
  updateRoomName: (name: string) => Promise<void>
  transferOwnership: (username: string) => Promise<{ error?: string }>
}

export function useRoom(roomId: string): UseRoomReturn {
  const supabase = createClient()
  const [room, setRoom] = useState<Room | null>(null)
  const [members, setMembers] = useState<(RoomMember & { profile: Profile })[]>([])
  const [queue, setQueue] = useState<(DJQueueEntry & { profile: Profile })[]>([])
  const [votes, setVotes] = useState<Vote[]>([])
  const [currentDJProfile, setCurrentDJProfile] = useState<Profile | null>(null)
  const [currentUserProfile, setCurrentUserProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [playbackElapsed, setPlaybackElapsed] = useState(0)

  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const elapsedTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const lastAutoSkipRef = useRef<number>(0)

  // ── Derived permissions ────────────────────────────────────────────────────
  const currentUserIsOwner =
    !!currentUserId &&
    (room?.owner_id === currentUserId || room?.created_by === currentUserId)

  const currentUserIsAdmin = currentUserProfile?.is_admin === true

  // ── Load initial data ──────────────────────────────────────────────────────
  const loadInitialData = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUserId(user?.id ?? null)

      const { data: roomData, error: roomError } = await supabase
        .from('rooms')
        .select('*')
        .eq('id', roomId)
        .single()

      if (roomError) throw new Error(roomError.message)
      setRoom(roomData)

      const { data: membersData } = await supabase
        .from('room_members')
        .select('*, profile:profiles(*)')
        .eq('room_id', roomId)
        .order('joined_at', { ascending: true })

      setMembers((membersData ?? []) as (RoomMember & { profile: Profile })[])

      // Fetch DJ queue ordered by spot
      const { data: queueData } = await supabase
        .from('dj_queue')
        .select('*, profile:profiles(*)')
        .eq('room_id', roomId)
        .order('spot', { ascending: true })

      let resolvedQueue = (queueData ?? []) as (DJQueueEntry & { profile: Profile })[]

      // Recovery: if a DJ is active but has no dj_queue row (old-system state),
      // insert them into spot 1 so the new queue logic works correctly.
      if (roomData.current_dj_id) {
        const djInQueue = resolvedQueue.some((q) => q.user_id === roomData.current_dj_id)
        if (!djInQueue) {
          const { error: upsertError } = await supabase.from('dj_queue').upsert(
            {
              room_id: roomId,
              user_id: roomData.current_dj_id,
              position: 1,
              spot: 1,
              songs: [],
            },
            { onConflict: 'room_id,user_id' }
          )
          // Expose upsert error visibly on screen so we can diagnose without DevTools
          if (upsertError) {
            setError(`[DEBUG] dj_queue upsert failed: ${upsertError.message} | code: ${upsertError.code}`)
            return
          }

          // Also ensure active_dj_spot is set
          await supabase
            .from('rooms')
            .update({ active_dj_spot: 1 })
            .eq('id', roomId)
            .is('active_dj_spot', null)

          // Re-fetch queue so state is accurate
          const { data: refreshed } = await supabase
            .from('dj_queue')
            .select('*, profile:profiles(*)')
            .eq('room_id', roomId)
            .order('spot', { ascending: true })
          resolvedQueue = (refreshed ?? []) as (DJQueueEntry & { profile: Profile })[]
        }
      }

      setQueue(resolvedQueue)

      if (roomData.current_video_id) {
        const { data: votesData } = await supabase
          .from('votes')
          .select('*')
          .eq('room_id', roomId)
          .eq('video_id', roomData.current_video_id)

        setVotes(votesData ?? [])
        setPlaybackElapsed(getElapsedSeconds(roomData.video_started_at))
      }

      if (roomData.current_dj_id) {
        const { data: djProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', roomData.current_dj_id)
          .single()
        setCurrentDJProfile(djProfile)
      }

      if (user) {
        const { data: userProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        setCurrentUserProfile(userProfile)

        await supabase.from('room_members').upsert(
          { room_id: roomId, user_id: user.id },
          { onConflict: 'room_id,user_id' }
        )
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load room')
    } finally {
      setIsLoading(false)
    }
  }, [roomId, supabase])

  // ── Heartbeat ──────────────────────────────────────────────────────────────
  const startHeartbeat = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const tick = async () => {
      await supabase
        .from('room_members')
        .update({ last_seen_at: new Date().toISOString() })
        .eq('room_id', roomId)
        .eq('user_id', user.id)
    }

    tick()
    heartbeatRef.current = setInterval(tick, 15_000)

    return () => {
      if (heartbeatRef.current) clearInterval(heartbeatRef.current)
      supabase
        .from('room_members')
        .delete()
        .eq('room_id', roomId)
        .eq('user_id', user.id)
        .then(() => {})
    }
  }, [roomId, supabase])

  // ── Real-time subscriptions ────────────────────────────────────────────────
  useEffect(() => {
    loadInitialData()
  }, [loadInitialData])

  useEffect(() => {
    const cleanup = startHeartbeat()

    const roomSub = supabase
      .channel(`room:${roomId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'rooms',
        filter: `id=eq.${roomId}`,
      }, async (payload) => {
        const updated = payload.new as Room
        setRoom(updated)
        setPlaybackElapsed(getElapsedSeconds(updated.video_started_at))

        if (updated.current_dj_id) {
          const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', updated.current_dj_id)
            .single()
          setCurrentDJProfile(data)
        } else {
          setCurrentDJProfile(null)
        }

        if (updated.current_video_id) {
          const { data: votesData } = await supabase
            .from('votes')
            .select('*')
            .eq('room_id', roomId)
            .eq('video_id', updated.current_video_id)
          setVotes(votesData ?? [])
        } else {
          setVotes([])
        }
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'room_members',
        filter: `room_id=eq.${roomId}`,
      }, async () => {
        const { data } = await supabase
          .from('room_members')
          .select('*, profile:profiles(*)')
          .eq('room_id', roomId)
          .order('joined_at', { ascending: true })
        setMembers((data ?? []) as (RoomMember & { profile: Profile })[])
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'dj_queue',
        filter: `room_id=eq.${roomId}`,
      }, async () => {
        const { data } = await supabase
          .from('dj_queue')
          .select('*, profile:profiles(*)')
          .eq('room_id', roomId)
          .order('spot', { ascending: true })
        setQueue((data ?? []) as (DJQueueEntry & { profile: Profile })[])
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'votes',
        filter: `room_id=eq.${roomId}`,
      }, async (payload) => {
        const vote = payload.new as Vote
        if (payload.eventType === 'INSERT') {
          setVotes((prev) => {
            const filtered = prev.filter(
              (v) => !(v.user_id === vote.user_id && v.video_id === vote.video_id)
            )
            return [...filtered, vote]
          })
        } else if (payload.eventType === 'UPDATE') {
          setVotes((prev) => prev.map((v) => v.id === vote.id ? vote : v))
        } else if (payload.eventType === 'DELETE') {
          setVotes((prev) => prev.filter((v) => v.id !== (payload.old as Vote).id))
        }
      })
      .subscribe()

    return () => {
      roomSub.unsubscribe()
      cleanup?.then((fn) => fn?.())
    }
  }, [roomId, supabase, startHeartbeat])

  // ── Elapsed timer ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (elapsedTimerRef.current) clearInterval(elapsedTimerRef.current)

    if (room?.video_started_at) {
      elapsedTimerRef.current = setInterval(() => {
        setPlaybackElapsed(getElapsedSeconds(room.video_started_at))
      }, 1000)
    }

    return () => {
      if (elapsedTimerRef.current) clearInterval(elapsedTimerRef.current)
    }
  }, [room?.video_started_at])

  // ── Vote counts ────────────────────────────────────────────────────────────
  const voteCounts: VoteCounts = (() => {
    const videoId = room?.current_video_id
    const relevant = videoId ? votes.filter((v) => v.video_id === videoId) : []
    const awesome = relevant.filter((v) => v.vote_type === 'awesome').length
    const lame = relevant.filter((v) => v.vote_type === 'lame').length
    const total = awesome + lame
    const userVote = currentUserId
      ? relevant.find((v) => v.user_id === currentUserId)?.vote_type ?? null
      : null

    return {
      awesome,
      lame,
      total,
      awesomePercent: total > 0 ? (awesome / total) * 100 : 0,
      lamePercent: total > 0 ? (lame / total) * 100 : 0,
      userVote,
    }
  })()

  // ── Auto-skip on lame threshold ────────────────────────────────────────────
  useEffect(() => {
    if (!room?.current_video_id || !currentUserId) return
    if (room.current_dj_id === currentUserId) return

    const listenerCount = members.length
    if (listenerCount < 2) return

    if (voteCounts.lamePercent >= room.lame_threshold && voteCounts.total >= 2) {
      const now = Date.now()
      if (now - lastAutoSkipRef.current < 10_000) return
      lastAutoSkipRef.current = now
      fetch(`/api/rooms/${roomId}/skip`, { method: 'POST' }).catch(console.error)
    }
  }, [voteCounts.lamePercent, voteCounts.total, room, roomId, currentUserId, members.length])

  // ── Actions ────────────────────────────────────────────────────────────────

  /** Claim the lowest available spot (1, 2, or 3). No-ops if all spots full. */
  const joinQueue = useCallback(async () => {
    if (!currentUserId) return

    const takenSpots = queue.map((q) => q.spot)
    const nextSpot = [1, 2, 3].find((s) => !takenSpots.includes(s))
    if (!nextSpot) return // all 3 spots taken

    await supabase.from('dj_queue').insert({
      room_id: roomId,
      user_id: currentUserId,
      position: nextSpot, // keep in sync for backward compat
      spot: nextSpot,
      songs: [],
    })

    // If no DJ is currently active, set this spot as active
    if (!room?.current_dj_id) {
      await supabase
        .from('rooms')
        .update({ current_dj_id: currentUserId, active_dj_spot: nextSpot })
        .eq('id', roomId)
    }
  }, [currentUserId, queue, room?.current_dj_id, roomId, supabase])

  const leaveQueue = useCallback(async () => {
    if (!currentUserId) return
    await supabase
      .from('dj_queue')
      .delete()
      .eq('room_id', roomId)
      .eq('user_id', currentUserId)
  }, [currentUserId, roomId, supabase])

  const playSong = useCallback(async (track: TrackInfo) => {
    await supabase
      .from('rooms')
      .update({
        current_video_id: track.videoId ?? null,
        current_video_title: track.title,
        current_video_thumbnail: track.thumbnail ?? null,
        current_track_source: track.source,
        current_track_url: track.trackUrl,
        video_started_at: new Date().toISOString(),
      })
      .eq('id', roomId)

    // Log to song_history
    await supabase.from('song_history').insert({
      room_id: roomId,
      played_by_user_id: currentUserId,
      track_url: track.trackUrl,
      track_title: track.title,
      track_source: track.source,
    })
  }, [roomId, currentUserId, supabase])

  const skipSong = useCallback(async () => {
    await fetch(`/api/rooms/${roomId}/skip`, { method: 'POST' })
  }, [roomId])

  const castVote = useCallback(async (type: VoteType) => {
    if (!currentUserId || !room?.current_video_id) return

    const existing = votes.find(
      (v) => v.user_id === currentUserId && v.video_id === room.current_video_id
    )

    if (existing) {
      if (existing.vote_type === type) {
        await supabase.from('votes').delete().eq('id', existing.id)
      } else {
        await supabase.from('votes').update({ vote_type: type }).eq('id', existing.id)
      }
    } else {
      await supabase.from('votes').insert({
        room_id: roomId,
        user_id: currentUserId,
        video_id: room.current_video_id,
        vote_type: type,
        dj_id: room.current_dj_id ?? null,
      })
    }
  }, [currentUserId, room?.current_video_id, room?.current_dj_id, roomId, supabase, votes])

  /** Owner/admin: remove a DJ from their spot */
  const removeFromQueue = useCallback(async (userId: string) => {
    await supabase
      .from('dj_queue')
      .delete()
      .eq('room_id', roomId)
      .eq('user_id', userId)
  }, [roomId, supabase])

  /** Active DJ: update their songs array */
  const updateDJSongs = useCallback(async (songs: TrackInfo[]) => {
    if (!currentUserId) return
    await supabase
      .from('dj_queue')
      .update({ songs })
      .eq('room_id', roomId)
      .eq('user_id', currentUserId)
  }, [currentUserId, roomId, supabase])

  /** Owner/admin: delete this room */
  const deleteRoom = useCallback(async () => {
    await supabase.from('rooms').delete().eq('id', roomId)
  }, [roomId, supabase])

  /** Owner/admin: rename this room */
  const updateRoomName = useCallback(async (name: string) => {
    await supabase.from('rooms').update({ name }).eq('id', roomId)
  }, [roomId, supabase])

  /** Owner/admin: transfer ownership to another user by username */
  const transferOwnership = useCallback(async (username: string): Promise<{ error?: string }> => {
    const { data: target } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username)
      .single()

    if (!target) return { error: `User "${username}" not found` }

    const { error } = await supabase
      .from('rooms')
      .update({ owner_id: target.id })
      .eq('id', roomId)

    return error ? { error: error.message } : {}
  }, [roomId, supabase])

  return {
    room,
    members,
    queue,
    votes,
    currentDJProfile,
    currentUserProfile,
    voteCounts,
    isLoading,
    error,
    currentUserId,
    currentUserIsOwner,
    currentUserIsAdmin,
    playbackElapsed,
    joinQueue,
    leaveQueue,
    playSong,
    skipSong,
    castVote,
    removeFromQueue,
    updateDJSongs,
    deleteRoom,
    updateRoomName,
    transferOwnership,
  }
}
