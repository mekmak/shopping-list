import { Badge, Table, Text, Title } from '@mantine/core'
import type { CatalogItem, ThingItem } from '../types'

interface CatalogViewProps {
  catalogItems: CatalogItem[]
  thingItems: ThingItem[]
}

function Blank() {
  return (
    <Text component="span" c="dimmed">
      —
    </Text>
  )
}

export function CatalogView({ catalogItems, thingItems }: CatalogViewProps) {
  const usage = new Map<string, number>()
  for (const ti of thingItems) {
    usage.set(ti.catalogItemId, (usage.get(ti.catalogItemId) ?? 0) + 1)
  }

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
        <Table highlightOnHover striped>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Item</Table.Th>
              <Table.Th>Unit</Table.Th>
              <Table.Th>Store</Table.Th>
              <Table.Th>Used by</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {catalogItems.map((ci) => (
              <Table.Tr key={ci.id}>
                <Table.Td>{ci.name}</Table.Td>
                <Table.Td>{ci.unit || <Blank />}</Table.Td>
                <Table.Td>{ci.defaultStore || <Blank />}</Table.Td>
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
