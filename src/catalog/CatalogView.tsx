import { Autocomplete, Badge, Table, TextInput, Text, Title } from '@mantine/core'
import type { CatalogItem, ThingItem } from '../types'

interface CatalogViewProps {
  catalogItems: CatalogItem[]
  thingItems: ThingItem[]
  onUpdateCatalogItem: (id: string, patch: Partial<CatalogItem>) => void
}

/** Distinct non-empty values of a field, for autocomplete consistency. */
function distinct(values: string[]): string[] {
  return [...new Set(values.map((v) => v.trim()).filter(Boolean))].sort()
}

export function CatalogView({ catalogItems, thingItems, onUpdateCatalogItem }: CatalogViewProps) {
  const usage = new Map<string, number>()
  for (const ti of thingItems) {
    usage.set(ti.catalogItemId, (usage.get(ti.catalogItemId) ?? 0) + 1)
  }

  const unitOptions = distinct(catalogItems.map((ci) => ci.unit))
  const storeOptions = distinct(catalogItems.map((ci) => ci.defaultStore))

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
        <Table highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Item</Table.Th>
              <Table.Th style={{ width: 150 }}>Unit</Table.Th>
              <Table.Th style={{ width: 200 }}>Store</Table.Th>
              <Table.Th style={{ width: 90 }}>Used by</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {catalogItems.map((ci) => (
              <Table.Tr key={ci.id}>
                <Table.Td>
                  <TextInput
                    size="xs"
                    variant="unstyled"
                    value={ci.name}
                    onChange={(e) => onUpdateCatalogItem(ci.id, { name: e.currentTarget.value })}
                  />
                </Table.Td>
                <Table.Td>
                  <Autocomplete
                    size="xs"
                    variant="unstyled"
                    placeholder="unit"
                    data={unitOptions}
                    value={ci.unit}
                    onChange={(v) => onUpdateCatalogItem(ci.id, { unit: v })}
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
                    onChange={(v) => onUpdateCatalogItem(ci.id, { defaultStore: v })}
                    comboboxProps={{ withinPortal: true }}
                  />
                </Table.Td>
                <Table.Td>
                  <Badge variant="light" color="gray">
                    {usage.get(ci.id) ?? 0}
                  </Badge>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      )}
    </div>
  )
}
