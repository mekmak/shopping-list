import { useState, type ReactNode } from 'react'
import { useDisclosure } from '@mantine/hooks'
import {
  Badge,
  Box,
  Button,
  Collapse,
  Group,
  Modal,
  Select,
  Stack,
  Text,
  Textarea,
  TextInput,
  Title,
} from '@mantine/core'
import type { Thing } from '../types'

interface BrainstormViewProps {
  things: Thing[]
  onUpdateThing: (id: string, patch: Partial<Thing>) => void
  onAddThing: (category: string, subCategory: string, name: string) => void
  onDeleteThing: (id: string) => void
}

interface SubGroup {
  subCategory: string
  things: Thing[]
}
interface CatGroup {
  category: string
  count: number
  subGroups: SubGroup[]
}

const SEP = ' › '
const subKeyOf = (category: string, subCategory: string) => `${category}${SEP}${subCategory}`

/** Group things by category → subcategory, preserving first-appearance order. */
function groupThings(things: Thing[]): CatGroup[] {
  const cats: CatGroup[] = []
  const byCat = new Map<string, CatGroup>()
  for (const t of things) {
    let cat = byCat.get(t.category)
    if (!cat) {
      cat = { category: t.category, count: 0, subGroups: [] }
      byCat.set(t.category, cat)
      cats.push(cat)
    }
    cat.count++
    let sub = cat.subGroups.find((s) => s.subCategory === t.subCategory)
    if (!sub) {
      sub = { subCategory: t.subCategory, things: [] }
      cat.subGroups.push(sub)
    }
    sub.things.push(t)
  }
  return cats
}

/** Distinct category › subcategory pairs (for the move dropdown), in order. */
function groupOptions(things: Thing[]): string[] {
  const seen = new Set<string>()
  const opts: string[] = []
  for (const t of things) {
    const key = subKeyOf(t.category, t.subCategory)
    if (!seen.has(key)) {
      seen.add(key)
      opts.push(key)
    }
  }
  return opts
}

function Chevron({ open }: { open: boolean }) {
  return (
    <Text component="span" c="dimmed" style={{ width: 14, display: 'inline-block' }}>
      {open ? '▾' : '▸'}
    </Text>
  )
}

export function BrainstormView({
  things,
  onUpdateThing,
  onAddThing,
  onDeleteThing,
}: BrainstormViewProps) {
  const [query, setQuery] = useState('')
  const [openCats, setOpenCats] = useState<Set<string>>(
    () => new Set(groupThings(things).map((g) => g.category)),
  )
  const [openSubs, setOpenSubs] = useState<Set<string>>(new Set())
  const [openThings, setOpenThings] = useState<Set<string>>(new Set())

  const q = query.trim().toLowerCase()
  const filtered = q ? things.filter((t) => t.name.toLowerCase().includes(q)) : things
  const groups = groupThings(filtered)
  const moveTargets = groupOptions(things)

  const searching = q.length > 0
  const isCatOpen = (c: string) => searching || openCats.has(c)
  const isSubOpen = (k: string) => searching || openSubs.has(k)

  function toggle(set: Set<string>, setter: (s: Set<string>) => void, key: string) {
    const next = new Set(set)
    if (next.has(key)) next.delete(key)
    else next.add(key)
    setter(next)
  }

  function expandAll() {
    setOpenCats(new Set(groups.map((g) => g.category)))
    setOpenSubs(
      new Set(groups.flatMap((g) => g.subGroups.map((s) => subKeyOf(g.category, s.subCategory)))),
    )
  }
  function collapseAll() {
    setOpenCats(new Set())
    setOpenSubs(new Set())
  }

  return (
    <div>
      <Title order={2} mb="md">
        Brainstorm
      </Title>

      <Group mb="md" align="flex-end" justify="space-between">
        <TextInput
          label="Search things"
          placeholder="e.g. ice, spritz, trash"
          value={query}
          onChange={(e) => setQuery(e.currentTarget.value)}
          style={{ flex: 1, maxWidth: 360 }}
        />
        <Group gap="xs">
          <Button variant="default" size="xs" onClick={expandAll} disabled={searching}>
            Expand all
          </Button>
          <Button variant="default" size="xs" onClick={collapseAll} disabled={searching}>
            Collapse all
          </Button>
        </Group>
      </Group>

      {groups.length === 0 ? (
        <Text c="dimmed">No things match “{query}”.</Text>
      ) : (
        <Stack gap="xs">
          {groups.map((cat) => {
            const catOpen = isCatOpen(cat.category)
            return (
              <Box key={cat.category}>
                <UnstyledToggle onClick={() => toggle(openCats, setOpenCats, cat.category)}>
                  <Chevron open={catOpen} />
                  <Text fw={700}>{cat.category}</Text>
                  <Badge variant="light" color="gray">
                    {cat.count}
                  </Badge>
                </UnstyledToggle>

                <Collapse in={catOpen}>
                  <Stack gap={4} pl="lg" pt={4}>
                    {cat.subGroups.map((sub) => {
                      const subKey = subKeyOf(cat.category, sub.subCategory)
                      const subOpen = isSubOpen(subKey)
                      return (
                        <Box key={subKey}>
                          <UnstyledToggle onClick={() => toggle(openSubs, setOpenSubs, subKey)}>
                            <Chevron open={subOpen} />
                            <Text fw={500}>{sub.subCategory}</Text>
                            <Badge variant="light" color="gray" size="sm">
                              {sub.things.length}
                            </Badge>
                          </UnstyledToggle>

                          <Collapse in={subOpen}>
                            <Stack gap={2} pl="lg" pt={2}>
                              {sub.things.map((t) => (
                                <ThingRow
                                  key={t.id}
                                  thing={t}
                                  open={openThings.has(t.id)}
                                  moveTargets={moveTargets}
                                  onToggle={() => toggle(openThings, setOpenThings, t.id)}
                                  onUpdateThing={onUpdateThing}
                                  onDeleteThing={onDeleteThing}
                                />
                              ))}
                              <QuickAddThing
                                onAdd={(name) =>
                                  onAddThing(cat.category, sub.subCategory, name)
                                }
                              />
                            </Stack>
                          </Collapse>
                        </Box>
                      )
                    })}
                  </Stack>
                </Collapse>
              </Box>
            )
          })}
        </Stack>
      )}
    </div>
  )
}

function ThingRow({
  thing,
  open,
  moveTargets,
  onToggle,
  onUpdateThing,
  onDeleteThing,
}: {
  thing: Thing
  open: boolean
  moveTargets: string[]
  onToggle: () => void
  onUpdateThing: (id: string, patch: Partial<Thing>) => void
  onDeleteThing: (id: string) => void
}) {
  const [confirmOpen, confirm] = useDisclosure(false)

  function move(value: string | null) {
    if (!value) return
    const [category, subCategory] = value.split(SEP)
    onUpdateThing(thing.id, { category, subCategory })
  }

  return (
    <Box>
      <UnstyledToggle onClick={onToggle}>
        <Chevron open={open} />
        <Text size="sm">{thing.name}</Text>
      </UnstyledToggle>

      <Collapse in={open}>
        <Stack gap="sm" pl="lg" pt={6} pb={10}>
          <TextInput
            label="Name"
            value={thing.name}
            onChange={(e) => onUpdateThing(thing.id, { name: e.currentTarget.value })}
          />
          <Select
            label="Category › Subcategory"
            data={moveTargets}
            value={subKeyOf(thing.category, thing.subCategory)}
            onChange={move}
            allowDeselect={false}
            comboboxProps={{ withinPortal: true }}
          />
          <Textarea
            label="Notes"
            placeholder="Notes about this thing…"
            autosize
            minRows={2}
            value={thing.notes}
            onChange={(e) => onUpdateThing(thing.id, { notes: e.currentTarget.value })}
          />
          <Text size="xs" c="dimmed">
            Items coming in B6.
          </Text>
          <Group justify="flex-end">
            <Button variant="subtle" color="red" size="xs" onClick={confirm.open}>
              Delete thing
            </Button>
          </Group>
        </Stack>
      </Collapse>

      <Modal opened={confirmOpen} onClose={confirm.close} title="Delete thing" centered>
        <Text mb="md">
          Delete <strong>{thing.name}</strong>? This also removes its item links. This
          can’t be undone.
        </Text>
        <Group justify="flex-end">
          <Button variant="default" onClick={confirm.close}>
            Cancel
          </Button>
          <Button
            color="red"
            onClick={() => {
              confirm.close()
              onDeleteThing(thing.id)
            }}
          >
            Delete
          </Button>
        </Group>
      </Modal>
    </Box>
  )
}

/** Inline "add a thing" input shown at the end of each subcategory. */
function QuickAddThing({ onAdd }: { onAdd: (name: string) => void }) {
  const [name, setName] = useState('')
  function submit() {
    const trimmed = name.trim()
    if (!trimmed) return
    onAdd(trimmed)
    setName('')
  }
  return (
    <Group gap="xs" pt={2}>
      <TextInput
        placeholder="+ Add a thing…"
        size="xs"
        variant="filled"
        value={name}
        onChange={(e) => setName(e.currentTarget.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') submit()
        }}
        style={{ flex: 1, maxWidth: 280 }}
      />
      <Button size="xs" variant="light" onClick={submit} disabled={!name.trim()}>
        Add
      </Button>
    </Group>
  )
}

/** A clickable row that lays out a chevron + label + badge horizontally. */
function UnstyledToggle({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <Box
      component="button"
      onClick={onClick}
      style={{
        all: 'unset',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        width: '100%',
      }}
    >
      {children}
    </Box>
  )
}
