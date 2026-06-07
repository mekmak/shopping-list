import { useRef, useState } from 'react'
import { Button, Group, Modal, Text } from '@mantine/core'

interface BackupControlsProps {
  getExport: () => string
  onImport: (text: string) => { ok: true } | { ok: false; error: string }
}

function downloadJson(filename: string, text: string) {
  const blob = new Blob([text], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function BackupControls({ getExport, onImport }: BackupControlsProps) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [pending, setPending] = useState<{ name: string; text: string } | null>(null)
  const [error, setError] = useState<string | null>(null)

  function handleExport() {
    const date = new Date().toISOString().slice(0, 10)
    downloadJson(`shopping-list-backup-${date}.json`, getExport())
  }

  async function handleFile(file: File) {
    const text = await file.text()
    setPending({ name: file.name, text })
  }

  function confirmImport() {
    if (!pending) return
    const result = onImport(pending.text)
    setPending(null)
    setError(result.ok ? null : result.error)
  }

  return (
    <Group gap="xs">
      <Button variant="default" size="xs" onClick={handleExport}>
        Export backup
      </Button>
      <Button variant="default" size="xs" onClick={() => fileRef.current?.click()}>
        Import backup
      </Button>
      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        style={{ display: 'none' }}
        onChange={(e) => {
          const file = e.currentTarget.files?.[0]
          if (file) void handleFile(file)
          e.currentTarget.value = '' // allow re-selecting the same file
        }}
      />

      <Modal opened={pending !== null} onClose={() => setPending(null)} title="Import backup" centered>
        <Text mb="md">
          Replace <strong>all</strong> current data with <strong>{pending?.name}</strong>? This
          overwrites everything and can’t be undone.
        </Text>
        <Group justify="flex-end">
          <Button variant="default" onClick={() => setPending(null)}>
            Cancel
          </Button>
          <Button color="red" onClick={confirmImport}>
            Replace data
          </Button>
        </Group>
      </Modal>

      <Modal opened={error !== null} onClose={() => setError(null)} title="Import failed" centered>
        <Text mb="md">{error}</Text>
        <Group justify="flex-end">
          <Button onClick={() => setError(null)}>OK</Button>
        </Group>
      </Modal>
    </Group>
  )
}
