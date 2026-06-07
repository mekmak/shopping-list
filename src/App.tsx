import { Container, Tabs, Text, Title } from '@mantine/core'
import { useDataset } from './store'
import { BrainstormView } from './brainstorm/BrainstormView'
import { newId } from './id'
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

  const addThing = (category: string, subCategory: string, name: string) =>
    setData((d) => ({
      ...d,
      things: [...d.things, { id: newId(), name, category, subCategory, notes: '' }],
    }))

  const deleteThing = (id: string) =>
    setData((d) => ({
      ...d,
      things: d.things.filter((t) => t.id !== id),
      thingItems: d.thingItems.filter((ti) => ti.thingId !== id),
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
          <BrainstormView
            things={data.things}
            onUpdateThing={updateThing}
            onAddThing={addThing}
            onDeleteThing={deleteThing}
          />
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
