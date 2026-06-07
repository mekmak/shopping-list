import { Container, Tabs, Text, Title } from '@mantine/core'
import { useDataset } from './store'
import { BrainstormView } from './brainstorm/BrainstormView'
import type { Thing } from './types'

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
  const { data, setData } = useDataset()

  const updateThing = (id: string, patch: Partial<Thing>) =>
    setData((d) => ({
      ...d,
      things: d.things.map((t) => (t.id === id ? { ...t, ...patch } : t)),
    }))

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
          <BrainstormView things={data.things} onUpdateThing={updateThing} />
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
