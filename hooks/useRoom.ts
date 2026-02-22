'use client'

import { createClient } from '@/lib/supabase/client'
import type {
  DJQueueEntry,
  Profile,
  Room,
  RoomMember,
  Vote,
  VoteCounts,
  VoteType,
  YouTubeVideoInfo,
} from '@/types'
import { getElapsedSeconds } from '@/lib/utils'
import { useCallback, useEffect, useRef, useState } from 'react'

interface UseRoomReturn {
  room: Room | null
  members: (RoomMember & { profile: Profile })[]
  queue: (DJQueueEntry & { profile: Profile })[]
  votes: Vote[]
  currentDJProfile: Profile | null
  voteCounts: VoteCounts
  isLoading: boolean
  error: string | null
  currentUserId: string | null
  playbackElapsed: number
  // Actions
  joinQueue: () => Promise<void>
  leaveQueue: () => Promise<void>
  playSong: (video: YouTubeVideoInfo) => Promise<void>
  skipSong: () => Promise<void>
  castVote: (type: VoteType) => Promise<void>
}

export function useRoom(roomId: string): UseRoomReturn {
  const supabase = createClient()
  const [room, setRoom] = useState<Room | null>(null)
  const [members, setMembers] = useState<(RoomMember & { profile: Profile })[]>([])
  const [queue, setQueue] = useState<(DJQueueEntry & { profile: Profile })[]>([])
  const [votes, setVotes] = useState<Vote[]>([])
  const [currentDJProfile, setCurrentDJProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [playbackElapsed, setPlaybackElapsed] = useState(0)

  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const elapsedTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const lastAutoSkipRef = useRef<number>(0)

  // ── Load initial data ──────────────────────────────────────────────────────
  const loadInitialData = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUserId(user?.id ?? null)

      // Fetch room
      const { data: roomData, error: roomError } = await supabase
        .from('rooms')
        .select('*')
        .eq('id', roomId)
        .single()

      if (roomError) throw new Error(roomError.message)
      setRoom(roomData)

      // Fetch members with profiles
      const { data: membersData } = await supabase
        .from('room_members')
        .select('*, profile:profiles(*)')
        .eq('room_id', roomId)
        .order('joined_at', { ascending: true })

      setMembers((membersData ?? []) as (RoomMember & { profile: Profile })[])

      // Fetch DJ queue with profiles
      const { data: queueData } = await supabase
        .from('dj_queue')
        .select('*, profile:profiles(*)')
        .eq('room_id', roomId)
        .order('position', { ascending: true })

      setQueue((queueData ?? []) as (DJQueueEntry & { profile: Profile })[])

      // Fetch votes for current video
      if (roomData.current_video_id) {
        const { data: votesData } = await supabase
          .from('votes')
          .select('*')
          .eq('room_id', roomId)
          .eq('video_id', roomData.current_video_id)

        setVotes(votesData ?? [])
        setPlaybackElapsed(getElapsedSeconds(roomData.video_started_at))
      }

      // Fetch current DJ profile
      if (roomData.current_dj_id) {
        const { data: djProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', roomData.current_dj_id)
          .single()

        setCurrentDJProfile(djProfile)
      }

      // Join the room (upsert presence)
      if (user) {
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

  // ── Heartbeat to maintain presence ────────────────────────────────────────
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
      // Leave room on unmount
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

    // Subscribe to room changes (playback state)
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

        // Refresh DJ profile if DJ changed
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

        // Clear votes when video changes
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
          .order('position', { ascending: true })
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
          setVotes((prev) =>
            prev.map((v) => v.id === vote.id ? vote : v)
          )
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

  // ── Compute vote counts ────────────────────────────────────────────────────
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

  // ── Auto-skip if lame votes exceed threshold ────────────────────────────────
  useEffect(() => {
    if (!room?.current_video_id || !currentUserId) return
    if (room.current_dj_id === currentUserId) return // DJ handles skip manually

    const listenerCount = members.length
    if (listenerCount < 2) return

    const lamePercent = voteCounts.lamePercent
    if (lamePercent >= room.lame_threshold && voteCounts.total >= 2) {
      const now = Date.now()
      if (now - lastAutoSkipRef.current < 10_000) return // 10-second cooldown
      lastAutoSkipRef.current = now
      fetch(`/api/rooms/${roomId}/skip`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }).catch(console.error)
    }
  }, [voteCounts.lamePercent, voteCounts.total, room, roomId, currentUserId, members.length])

  // ── Actions ────────────────────────────────────────────────────────────────
  const joinQueue = useCallback(async () => {
    if (!currentUserId) return
    const nextPos = queue.length > 0 ? Math.max(...queue.map((q) => q.position)) + 1 : 1

    // If no current DJ, become DJ immediately
    if (!room?.current_dj_id) {
      await supabase
        .from('rooms')
        .update({ current_dj_id: currentUserId })
        .eq('id', roomId)
      return
    }

    await supabase.from('dj_queue').insert({
      room_id: roomId,
      user_id: currentUserId,
      position: nextPos,
    })
  }, [currentUserId, queue, room?.current_dj_id, roomId, supabase])

  const leaveQueue = useCallback(async () => {
    if (!currentUserId) return
    await supabase
      .from('dj_queue')
      .delete()
      .eq('room_id', roomId)
      .eq('user_id', currentUserId)
  }, [currentUserId, roomId, supabase])

  const playSong = useCallback(async (video: YouTubeVideoInfo) => {
    await supabase
      .from('rooms')
      .update({
        current_video_id: video.videoId,
        current_video_title: video.title,
        current_video_thumbnail: video.thumbnail,
        video_started_at: new Date().toISOString(),
      })
      .eq('id', roomId)
  }, [roomId, supabase])

  const skipSong = useCallback(async () => {
    await fetch(`/api/rooms/${roomId}/skip`, {
      method: 'POST',
    })
  }, [roomId])

  const castVote = useCallback(async (type: VoteType) => {
    if (!currentUserId || !room?.current_video_id) return

    const existing = votes.find(
      (v) => v.user_id === currentUserId && v.video_id === room.current_video_id
    )

    if (existing) {
      if (existing.vote_type === type) {
        // Toggle off
        await supabase.from('votes').delete().eq('id', existing.id)
      } else {
        // Change vote
        await supabase.from('votes').update({ vote_type: type }).eq('id', existing.id)
      }
    } else {
      await supabase.from('votes').insert({
        room_id: roomId,
        user_id: currentUserId,
        video_id: room.current_video_id,
        vote_type: type,
      })
    }
  }, [currentUserId, room?.current_video_id, roomId, supabase, votes])

  return {
    room,
    members,
    queue,
    votes,
    currentDJProfile,
    voteCounts,
    isLoading,
    error,
    currentUserId,
    playbackElapsed,
    joinQueue,
    leaveQueue,
    playSong,
    skipSong,
    castVote,
  }
}
