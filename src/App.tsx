import { Button, Code, Container, Group, List, Tabs, Text, Title } from '@mantine/core'
import { useDataset } from './store'
import type { Dataset } from './types'

/** Temporary A2 readout proving the dataset loads + persists. Removed in B1. */
function DataReadout({ data, onReset }: { data: Dataset; onReset: () => void }) {
  const categories = new Set(data.things.map((t) => t.category))
  const subCategories = new Set(data.things.map((t) => `${t.category} › ${t.subCategory}`))

  return (
    <div>
      <Title order={2} mb="xs">
        Brainstorm
      </Title>
      <Text c="dimmed" mb="md">
        Data layer wired up. (Temporary readout — the real tree lands in B1.)
      </Text>

      <List spacing="xs" mb="md">
        <List.Item>
          Things: <Code>{data.things.length}</Code>
        </List.Item>
        <List.Item>
          Categories: <Code>{categories.size}</Code> · Subcategories:{' '}
          <Code>{subCategories.size}</Code>
        </List.Item>
        <List.Item>
          Catalog items: <Code>{data.catalogItems.length}</Code>
        </List.Item>
        <List.Item>
          Thing↔item links: <Code>{data.thingItems.length}</Code>
        </List.Item>
      </List>

      <Group>
        <Button variant="light" color="red" onClick={onReset}>
          Reset to seed
        </Button>
      </Group>
      <Text size="xs" c="dimmed" mt="xs">
        Tip: edits persist to localStorage. Reload the page to confirm they stick;
        use Reset to restore the original seed.
      </Text>
    </div>
  )
}

function Placeholder({ title }: { title: string }) {
  return (
    <div>
      <Title order={2} mb="xs">
        {title}
      </Title>
      <Text c="dimmed">Coming soon.</Text>
    </div>
  )
}

export default function App() {
  const { data, resetToSeed } = useDataset()

  return (
    <Container size="md" py="lg">
      <Title order={3} mb="md">
        Event Shopping List
      </Title>

      <Tabs defaultValue="brainstorm" keepMounted={false}>
        <Tabs.List mb="lg">
          <Tabs.Tab value="brainstorm">Brainstorm</Tabs.Tab>
          <Tabs.Tab value="catalog">Catalog</Tabs.Tab>
          <Tabs.Tab value="export">Export</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="brainstorm">
          <DataReadout data={data} onReset={resetToSeed} />
        </Tabs.Panel>
        <Tabs.Panel value="catalog">
          <Placeholder title="Catalog" />
        </Tabs.Panel>
        <Tabs.Panel value="export">
          <Placeholder title="Export" />
        </Tabs.Panel>
      </Tabs>
    </Container>
  )
}
