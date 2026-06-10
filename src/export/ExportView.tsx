import { useState } from 'react'
import {
  Box,
  Button,
  Checkbox,
  Group,
  Paper,
  SegmentedControl,
  Stack,
  Text,
  Title,
} from '@mantine/core'
import type { Dataset } from '../types'
import {
  blocksToMarkdown,
  buildCategoryBlocks,
  buildStoreBlocks,
  DEFAULT_OPTIONS,
  type Block,
  type ExportOptions,
} from './exportModel'

type Pivot = 'store' | 'category'

/** Renders export blocks as a formatted preview (not raw Markdown). */
function Preview({ blocks, checkboxes }: { blocks: Block[]; checkboxes: boolean }) {
  if (blocks.length === 0) {
    return (
      <Text c="dimmed">
        Nothing to export yet — add items to things in the Brainstorm tab first.
      </Text>
    )
  }
  return (
    <Stack gap={4}>
      {blocks.map((b, i) => {
        if (b.type === 'heading') {
          return (
            <Title key={i} order={Math.min(b.level + 3, 6) as 4 | 5 | 6} mt={i === 0 ? 0 : 'sm'}>
              {b.text}
            </Title>
          )
        }
        if (b.type === 'subitem') {
          return (
            <Text key={i} c="dimmed" size="xs" pl="xl">
              {b.text}
              {b.note && (
                <Text component="span" fs="italic">
                  {' — '}
                  {b.note}
                </Text>
              )}
            </Text>
          )
        }
        return (
          <Text key={i} size="sm">
            {checkboxes ? '☐ ' : '• '}
            {b.text}
            {b.note && (
              <Text component="span" c="dimmed" fs="italic" size="sm">
                {' ('}
                {b.note}
                {')'}
              </Text>
            )}
          </Text>
        )
      })}
    </Stack>
  )
}

export function ExportView({ data }: { data: Dataset }) {
  const [copied, setCopied] = useState(false)
  const [pivot, setPivot] = useState<Pivot>('store')
  const [opts, setOpts] = useState<ExportOptions>(DEFAULT_OPTIONS)
  const setOpt = (key: keyof ExportOptions, value: boolean) =>
    setOpts((o) => ({ ...o, [key]: value }))

  const content =
    pivot === 'store' ? buildStoreBlocks(data, opts) : buildCategoryBlocks(data, opts)
  // Prepend the event title as the document heading (only when there's content).
  const blocks: Block[] =
    content.length > 0 && data.title.trim()
      ? [{ type: 'heading', level: 1, text: data.title.trim() }, ...content]
      : content
  // Checkboxes are a shopping-list affordance; the Menu is always plain bullets.
  const checkboxes = pivot === 'store' && opts.checkboxes
  const markdown = blocksToMarkdown(blocks, { ...opts, checkboxes })

  async function copy() {
    await navigator.clipboard.writeText(markdown)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div>
      <Title order={2} mb="md">
        Export
      </Title>

      <Group justify="space-between" mb="md" align="center">
        <SegmentedControl
          size="xs"
          value={pivot}
          onChange={(v) => setPivot(v as Pivot)}
          data={[
            { label: 'Shopping list', value: 'store' },
            { label: 'Menu', value: 'category' },
          ]}
        />
        <Button size="xs" onClick={copy} disabled={blocks.length === 0}>
          {copied ? 'Copied!' : 'Copy Markdown'}
        </Button>
      </Group>

      <Group mb="md" gap="lg">
        <Checkbox
          size="xs"
          label="Checkboxes"
          checked={opts.checkboxes}
          disabled={pivot !== 'store'}
          onChange={(e) => setOpt('checkboxes', e.currentTarget.checked)}
        />
        <Checkbox
          size="xs"
          label="Amounts"
          checked={opts.amounts}
          onChange={(e) => setOpt('amounts', e.currentTarget.checked)}
        />
        <Checkbox
          size="xs"
          label="Notes"
          checked={opts.notes}
          onChange={(e) => setOpt('notes', e.currentTarget.checked)}
        />
        <Checkbox
          size="xs"
          label="Source things"
          checked={opts.sources}
          disabled={pivot !== 'store'}
          onChange={(e) => setOpt('sources', e.currentTarget.checked)}
        />
      </Group>

      <Paper withBorder p="md" radius="md">
        <Box>
          <Preview blocks={blocks} checkboxes={checkboxes} />
        </Box>
      </Paper>
    </div>
  )
}
