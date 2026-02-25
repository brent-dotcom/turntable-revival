'use client'

import { useState } from 'react'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import type { Room } from '@/types'

interface RoomSettingsProps {
  isOpen: boolean
  onClose: () => void
  room: Room
  onDeleteRoom: () => Promise<void>
  onUpdateName: (name: string) => Promise<void>
  onTransferOwnership: (username: string) => Promise<{ error?: string }>
}

export default function RoomSettings({
  isOpen,
  onClose,
  room,
  onDeleteRoom,
  onUpdateName,
  onTransferOwnership,
}: RoomSettingsProps) {
  const [nameValue, setNameValue] = useState(room.name)
  const [nameLoading, setNameLoading] = useState(false)
  const [nameSaved, setNameSaved] = useState(false)

  const [transferUsername, setTransferUsername] = useState('')
  const [transferLoading, setTransferLoading] = useState(false)
  const [transferError, setTransferError] = useState('')
  const [transferDone, setTransferDone] = useState(false)

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

  async function handleSaveName() {
    if (!nameValue.trim() || nameValue.trim() === room.name) return
    setNameLoading(true)
    await onUpdateName(nameValue.trim())
    setNameLoading(false)
    setNameSaved(true)
    setTimeout(() => setNameSaved(false), 2000)
  }

  async function handleTransfer() {
    if (!transferUsername.trim()) return
    setTransferLoading(true)
    setTransferError('')
    const result = await onTransferOwnership(transferUsername.trim())
    setTransferLoading(false)
    if (result.error) {
      setTransferError(result.error)
    } else {
      setTransferDone(true)
      setTransferUsername('')
    }
  }

  async function handleDelete() {
    setDeleteLoading(true)
    await onDeleteRoom()
    // Parent will redirect after deletion
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Room Settings">
      <div className="flex flex-col gap-6">

        {/* Rename */}
        <section className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wide">Room Name</h3>
          <div className="flex gap-2">
            <Input
              value={nameValue}
              onChange={(e) => { setNameValue(e.target.value); setNameSaved(false) }}
              onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
              className="flex-1"
            />
            <Button
              variant="secondary"
              size="sm"
              onClick={handleSaveName}
              loading={nameLoading}
              disabled={!nameValue.trim() || nameValue.trim() === room.name}
            >
              {nameSaved ? '✓ Saved' : 'Save'}
            </Button>
          </div>
        </section>

        {/* Transfer Ownership */}
        <section className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wide">Transfer Ownership</h3>
          <p className="text-xs text-text-muted">Enter a username to transfer room ownership to them.</p>
          {transferDone ? (
            <p className="text-sm text-accent-green">✓ Ownership transferred</p>
          ) : (
            <>
              <div className="flex gap-2">
                <Input
                  value={transferUsername}
                  onChange={(e) => { setTransferUsername(e.target.value); setTransferError('') }}
                  onKeyDown={(e) => e.key === 'Enter' && handleTransfer()}
                  placeholder="username"
                  className="flex-1"
                />
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleTransfer}
                  loading={transferLoading}
                  disabled={!transferUsername.trim()}
                >
                  Transfer
                </Button>
              </div>
              {transferError && <p className="text-xs text-accent-red">{transferError}</p>}
            </>
          )}
        </section>

        {/* Delete Room */}
        <section className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wide">Danger Zone</h3>
          {!showDeleteConfirm ? (
            <Button variant="danger" onClick={() => setShowDeleteConfirm(true)}>
              Delete Room
            </Button>
          ) : (
            <div className="flex flex-col gap-3 p-3 border border-accent-red/40 rounded-lg bg-accent-red/5">
              <p className="text-sm text-text-primary">
                Are you sure? <span className="font-semibold">This cannot be undone.</span> All members will be redirected to the lobby.
              </p>
              <div className="flex gap-2">
                <Button
                  variant="danger"
                  onClick={handleDelete}
                  loading={deleteLoading}
                  className="flex-1"
                >
                  Yes, Delete
                </Button>
                <Button variant="ghost" onClick={() => setShowDeleteConfirm(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </section>
      </div>
    </Modal>
  )
}
