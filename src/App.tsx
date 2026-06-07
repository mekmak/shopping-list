import { Container, Tabs, Text, Title } from '@mantine/core'

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
          <Placeholder title="Brainstorm" />
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
