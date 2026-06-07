import { useState } from 'react'
import { Box, Button, Group, Paper, SegmentedControl, Stack, Text, Title } from '@mantine/core'
import type { Dataset } from '../types'
import {
  blocksToMarkdown,
  buildCategoryBlocks,
  buildStoreBlocks,
  buildThingBlocks,
  DEFAULT_OPTIONS,
  type Block,
} from './exportModel'

type Pivot = 'store' | 'thing' | 'category'

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
            <Title key={i} order={(b.level + 2) as 3 | 4 | 5} mt={i === 0 ? 0 : 'sm'}>
              {b.text}
              {b.sub && (
                <Text component="span" c="dimmed" fw={400} size="sm">
                  {'  '}
                  ({b.sub})
                </Text>
              )}
            </Title>
          )
        }
        if (b.type === 'note') {
          return (
            <Text key={i} c="dimmed" fs="italic" size="sm" pl="sm">
              {b.text}
            </Text>
          )
        }
        return (
          <Text key={i} size="sm">
            {checkboxes ? '☐ ' : '• '}
            {b.text}
          </Text>
        )
      })}
    </Stack>
  )
}

export function ExportView({ data }: { data: Dataset }) {
  const [copied, setCopied] = useState(false)
  const [pivot, setPivot] = useState<Pivot>('store')
  const opts = DEFAULT_OPTIONS

  const blocks =
    pivot === 'store'
      ? buildStoreBlocks(data, opts)
      : pivot === 'thing'
        ? buildThingBlocks(data, opts)
        : buildCategoryBlocks(data, opts)
  const markdown = blocksToMarkdown(blocks, opts)

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
            { label: 'By store', value: 'store' },
            { label: 'By thing', value: 'thing' },
            { label: 'By category', value: 'category' },
          ]}
        />
        <Button size="xs" onClick={copy} disabled={blocks.length === 0}>
          {copied ? 'Copied!' : 'Copy Markdown'}
        </Button>
      </Group>

      <Paper withBorder p="md" radius="md">
        <Box>
          <Preview blocks={blocks} checkboxes={opts.checkboxes} />
        </Box>
      </Paper>
    </div>
  )
}
