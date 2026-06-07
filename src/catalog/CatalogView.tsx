import { Fragment, memo, useCallback, useMemo, useState } from 'react'
import {
  ActionIcon,
  Anchor,
  Autocomplete,
  Badge,
  Button,
  Group,
  Modal,
  SegmentedControl,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
  UnstyledButton,
} from '@mantine/core'
import type { CatalogItem, Thing, ThingItem } from '../types'

interface CatalogViewProps {
  catalogItems: CatalogItem[]
  thingItems: ThingItem[]
  things: Thing[]
  onUpdateCatalogItem: (id: string, patch: Partial<CatalogItem>) => void
  onDeleteCatalogItem: (id: string) => void
  onJumpToThing: (thingId: string) => void
}

type Filter = 'all' | 'missing-store' | 'missing-unit' | 'orphans'
type SortKey = 'name' | 'store' | 'usage'

const EMPTY_THINGS: Thing[] = []

function distinct(values: string[]): string[] {
  return [...new Set(values.map((v) => v.trim()).filter(Boolean))].sort()
}

export function CatalogView({
  catalogItems,
  thingItems,
  things,
  onUpdateCatalogItem,
  onDeleteCatalogItem,
  onJumpToThing,
}: CatalogViewProps) {
  const [filter, setFilter] = useState<Filter>('all')
  const [sort, setSort] = useState<SortKey>('name')
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [pendingDelete, setPendingDelete] = useState<CatalogItem | null>(null)

  // The things using each catalog item (recomputed only when links/things change).
  const usingThings = useMemo(() => {
    const thingById = new Map(things.map((t) => [t.id, t]))
    const map = new Map<string, Thing[]>()
    for (const ti of thingItems) {
      const t = thingById.get(ti.thingId)
      if (!t) continue
      const list = map.get(ti.catalogItemId)
      if (list) list.push(t)
      else map.set(ti.catalogItemId, [t])
    }
    return map
  }, [thingItems, things])
  const usageOf = useCallback((id: string) => usingThings.get(id)?.length ?? 0, [usingThings])

  const unitOptions = useMemo(() => distinct(catalogItems.map((ci) => ci.unit)), [catalogItems])
  const storeOptions = useMemo(
    () => distinct(catalogItems.map((ci) => ci.defaultStore)),
    [catalogItems],
  )

  const counts = {
    all: catalogItems.length,
    'missing-store': catalogItems.filter((ci) => !ci.defaultStore.trim()).length,
    'missing-unit': catalogItems.filter((ci) => !ci.unit.trim()).length,
    orphans: catalogItems.filter((ci) => usageOf(ci.id) === 0).length,
  }

  const rows = useMemo(() => {
    const filtered = catalogItems.filter((ci) => {
      switch (filter) {
        case 'missing-store':
          return !ci.defaultStore.trim()
        case 'missing-unit':
          return !ci.unit.trim()
        case 'orphans':
          return (usingThings.get(ci.id)?.length ?? 0) === 0
        default:
          return true
      }
    })
    return [...filtered].sort((a, b) => {
      if (sort === 'usage')
        return (usingThings.get(b.id)?.length ?? 0) - (usingThings.get(a.id)?.length ?? 0)
      if (sort === 'store') return a.defaultStore.localeCompare(b.defaultStore)
      return a.name.localeCompare(b.name)
    })
  }, [catalogItems, filter, sort, usingThings])

  const toggleExpand = useCallback(
    (id: string) =>
      setExpanded((s) => {
        const next = new Set(s)
        if (next.has(id)) next.delete(id)
        else next.add(id)
        return next
      }),
    [],
  )

  return (
    <div>
      <Title order={2} mb="md">
        Catalog
      </Title>

      {catalogItems.length === 0 ? (
        <Text c="dimmed">
          No catalog items yet. Add items to things in the Brainstorm tab and they’ll show up
          here.
        </Text>
      ) : (
        <>
          <Group justify="space-between" mb="md" align="flex-end">
            <SegmentedControl
              size="xs"
              value={filter}
              onChange={(v) => setFilter(v as Filter)}
              data={[
                { label: `All (${counts.all})`, value: 'all' },
                { label: `Missing store (${counts['missing-store']})`, value: 'missing-store' },
                { label: `Missing unit (${counts['missing-unit']})`, value: 'missing-unit' },
                { label: `Orphans (${counts.orphans})`, value: 'orphans' },
              ]}
            />
            <SegmentedControl
              size="xs"
              value={sort}
              onChange={(v) => setSort(v as SortKey)}
              data={[
                { label: 'Name', value: 'name' },
                { label: 'Store', value: 'store' },
                { label: 'Used by', value: 'usage' },
              ]}
            />
          </Group>

          {rows.length === 0 ? (
            <Text c="dimmed">No items match this filter.</Text>
          ) : (
            <Table highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Item</Table.Th>
                  <Table.Th style={{ width: 150 }}>Unit</Table.Th>
                  <Table.Th style={{ width: 200 }}>Store</Table.Th>
                  <Table.Th style={{ width: 90 }}>Used by</Table.Th>
                  <Table.Th style={{ width: 40 }} />
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {rows.map((ci) => (
                  <CatalogRow
                    key={ci.id}
                    ci={ci}
                    used={usingThings.get(ci.id) ?? EMPTY_THINGS}
                    isOpen={expanded.has(ci.id)}
                    unitOptions={unitOptions}
                    storeOptions={storeOptions}
                    onUpdate={onUpdateCatalogItem}
                    onToggleExpand={toggleExpand}
                    onRequestDelete={setPendingDelete}
                    onJumpToThing={onJumpToThing}
                  />
                ))}
              </Table.Tbody>
            </Table>
          )}
        </>
      )}

      <Modal
        opened={pendingDelete !== null}
        onClose={() => setPendingDelete(null)}
        title="Delete catalog item"
        centered
      >
        {pendingDelete && (
          <>
            <Text mb="md">
              Delete <strong>{pendingDelete.name}</strong>?
              {usageOf(pendingDelete.id) > 0
                ? ` It will be unlinked from ${usageOf(pendingDelete.id)} thing${
                    usageOf(pendingDelete.id) === 1 ? '' : 's'
                  }.`
                : ''}{' '}
              This can’t be undone.
            </Text>
            <Group justify="flex-end">
              <Button variant="default" onClick={() => setPendingDelete(null)}>
                Cancel
              </Button>
              <Button
                color="red"
                onClick={() => {
                  onDeleteCatalogItem(pendingDelete.id)
                  setPendingDelete(null)
                }}
              >
                Delete
              </Button>
            </Group>
          </>
        )}
      </Modal>
    </div>
  )
}

const CatalogRow = memo(function CatalogRow({
  ci,
  used,
  isOpen,
  unitOptions,
  storeOptions,
  onUpdate,
  onToggleExpand,
  onRequestDelete,
  onJumpToThing,
}: {
  ci: CatalogItem
  used: Thing[]
  isOpen: boolean
  unitOptions: string[]
  storeOptions: string[]
  onUpdate: (id: string, patch: Partial<CatalogItem>) => void
  onToggleExpand: (id: string) => void
  onRequestDelete: (ci: CatalogItem) => void
  onJumpToThing: (thingId: string) => void
}) {
  return (
    <Fragment>
      <Table.Tr>
        <Table.Td>
          <TextInput
            size="xs"
            variant="unstyled"
            value={ci.name}
            onChange={(e) => onUpdate(ci.id, { name: e.currentTarget.value })}
          />
        </Table.Td>
        <Table.Td>
          <Autocomplete
            size="xs"
            variant="unstyled"
            placeholder="unit"
            data={unitOptions}
            value={ci.unit}
            onChange={(v) => onUpdate(ci.id, { unit: v })}
            comboboxProps={{ withinPortal: true }}
          />
        </Table.Td>
        <Table.Td>
          <Autocomplete
            size="xs"
            variant="unstyled"
            placeholder="store"
            data={storeOptions}
            value={ci.defaultStore}
            onChange={(v) => onUpdate(ci.id, { defaultStore: v })}
            comboboxProps={{ withinPortal: true }}
          />
        </Table.Td>
        <Table.Td>
          <UnstyledButton
            onClick={() => used.length > 0 && onToggleExpand(ci.id)}
            style={{ cursor: used.length > 0 ? 'pointer' : 'default' }}
          >
            <Badge variant="light" color={used.length === 0 ? 'gray' : 'blue'}>
              {used.length > 0 ? (isOpen ? '▾ ' : '▸ ') : ''}
              {used.length}
            </Badge>
          </UnstyledButton>
        </Table.Td>
        <Table.Td>
          <ActionIcon
            variant="subtle"
            color="red"
            aria-label={`Delete ${ci.name}`}
            onClick={() => onRequestDelete(ci)}
          >
            ✕
          </ActionIcon>
        </Table.Td>
      </Table.Tr>
      {isOpen && used.length > 0 && (
        <Table.Tr>
          <Table.Td colSpan={5} style={{ background: 'var(--mantine-color-gray-0)' }}>
            <Stack gap={2} pl="md">
              {used.map((t) => (
                <Anchor key={t.id} size="sm" onClick={() => onJumpToThing(t.id)}>
                  {t.name}{' '}
                  <Text component="span" c="dimmed" size="xs">
                    ({t.category} › {t.subCategory})
                  </Text>
                </Anchor>
              ))}
            </Stack>
          </Table.Td>
        </Table.Tr>
      )}
    </Fragment>
  )
})
