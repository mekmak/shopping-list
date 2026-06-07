import { useState } from 'react'
import { Button, Container, Group, Modal, Tabs, Text, Title } from '@mantine/core'
import { useDataset } from './store'
import { BrainstormView } from './brainstorm/BrainstormView'
import { CatalogView } from './catalog/CatalogView'
import { ExportView } from './export/ExportView'
import { BackupControls } from './BackupControls'
import { newId } from './id'
import type { CatalogItem, Thing } from './types'

export default function App() {
  const { data, setData, exportJson, importJson, resetToSeed } = useDataset()
  const [activeTab, setActiveTab] = useState<string | null>('brainstorm')
  const [focusThingId, setFocusThingId] = useState<string | null>(null)
  const [resetOpen, setResetOpen] = useState(false)

  const jumpToThing = (thingId: string) => {
    setActiveTab('brainstorm')
    setFocusThingId(thingId)
  }

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

  const addCategory = (name: string) =>
    setData((d) =>
      d.categories.some((c) => c.name === name)
        ? d
        : { ...d, categories: [...d.categories, { name, subCategories: [] }] },
    )

  const renameCategory = (oldName: string, newName: string) =>
    setData((d) => ({
      ...d,
      categories: d.categories.map((c) => (c.name === oldName ? { ...c, name: newName } : c)),
      things: d.things.map((t) => (t.category === oldName ? { ...t, category: newName } : t)),
    }))

  /** Delete a category; if non-empty, move its things into `moveTo` first. */
  const deleteCategory = (name: string, moveTo?: string) =>
    setData((d) => {
      let categories = d.categories
      let things = d.things
      if (moveTo) {
        const movedSubs = d.things.filter((t) => t.category === name).map((t) => t.subCategory)
        categories = categories.map((c) =>
          c.name === moveTo
            ? { ...c, subCategories: [...new Set([...c.subCategories, ...movedSubs])] }
            : c,
        )
        things = d.things.map((t) => (t.category === name ? { ...t, category: moveTo } : t))
      }
      return { ...d, categories: categories.filter((c) => c.name !== name), things }
    })

  const addSubCategory = (category: string, name: string) =>
    setData((d) => ({
      ...d,
      categories: d.categories.map((c) =>
        c.name === category && !c.subCategories.includes(name)
          ? { ...c, subCategories: [...c.subCategories, name] }
          : c,
      ),
    }))

  const renameSubCategory = (category: string, oldName: string, newName: string) =>
    setData((d) => ({
      ...d,
      categories: d.categories.map((c) =>
        c.name === category
          ? { ...c, subCategories: c.subCategories.map((s) => (s === oldName ? newName : s)) }
          : c,
      ),
      things: d.things.map((t) =>
        t.category === category && t.subCategory === oldName
          ? { ...t, subCategory: newName }
          : t,
      ),
    }))

  /** Delete a subcategory; if non-empty, move its things into `moveTo` first. */
  const deleteSubCategory = (category: string, name: string, moveTo?: string) =>
    setData((d) => ({
      ...d,
      categories: d.categories.map((c) =>
        c.name === category
          ? { ...c, subCategories: c.subCategories.filter((s) => s !== name) }
          : c,
      ),
      things: moveTo
        ? d.things.map((t) =>
            t.category === category && t.subCategory === name
              ? { ...t, subCategory: moveTo }
              : t,
          )
        : d.things,
    }))

  /** Add an item to a thing: reuse a catalog item by name, else create one. */
  const addItemToThing = (thingId: string, rawName: string) =>
    setData((d) => {
      const name = rawName.trim()
      if (!name) return d
      let item = d.catalogItems.find((ci) => ci.name.toLowerCase() === name.toLowerCase())
      let catalogItems = d.catalogItems
      if (!item) {
        item = { id: newId(), name, unit: '', defaultStore: '' }
        catalogItems = [...d.catalogItems, item]
      }
      const linked = d.thingItems.some(
        (ti) => ti.thingId === thingId && ti.catalogItemId === item!.id,
      )
      const thingItems = linked
        ? d.thingItems
        : [...d.thingItems, { thingId, catalogItemId: item.id, amount: '' }]
      return { ...d, catalogItems, thingItems }
    })

  const updateItemAmount = (thingId: string, catalogItemId: string, amount: string) =>
    setData((d) => ({
      ...d,
      thingItems: d.thingItems.map((ti) =>
        ti.thingId === thingId && ti.catalogItemId === catalogItemId ? { ...ti, amount } : ti,
      ),
    }))

  const removeItemFromThing = (thingId: string, catalogItemId: string) =>
    setData((d) => ({
      ...d,
      thingItems: d.thingItems.filter(
        (ti) => !(ti.thingId === thingId && ti.catalogItemId === catalogItemId),
      ),
    }))

  const updateCatalogItem = (id: string, patch: Partial<CatalogItem>) =>
    setData((d) => ({
      ...d,
      catalogItems: d.catalogItems.map((ci) => (ci.id === id ? { ...ci, ...patch } : ci)),
    }))

  /** Delete a catalog item and unlink it from every thing. */
  const deleteCatalogItem = (id: string) =>
    setData((d) => ({
      ...d,
      catalogItems: d.catalogItems.filter((ci) => ci.id !== id),
      thingItems: d.thingItems.filter((ti) => ti.catalogItemId !== id),
    }))

  return (
    <Container size="md" py="lg">
      <Group justify="space-between" align="center" mb="md">
        <Title order={3}>Event Shopping List</Title>
        <BackupControls getExport={exportJson} onImport={importJson} />
      </Group>

      <Tabs value={activeTab} onChange={setActiveTab} keepMounted={false}>
        <Tabs.List mb="lg">
          <Tabs.Tab value="brainstorm">Brainstorm</Tabs.Tab>
          <Tabs.Tab value="catalog">Catalog</Tabs.Tab>
          <Tabs.Tab value="export">Export</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="brainstorm">
          <BrainstormView
            categories={data.categories}
            things={data.things}
            catalogItems={data.catalogItems}
            thingItems={data.thingItems}
            onUpdateThing={updateThing}
            onAddThing={addThing}
            onDeleteThing={deleteThing}
            onAddCategory={addCategory}
            onRenameCategory={renameCategory}
            onDeleteCategory={deleteCategory}
            onAddSubCategory={addSubCategory}
            onRenameSubCategory={renameSubCategory}
            onDeleteSubCategory={deleteSubCategory}
            onAddItemToThing={addItemToThing}
            onUpdateItemAmount={updateItemAmount}
            onRemoveItemFromThing={removeItemFromThing}
            focusThingId={focusThingId}
            onFocusHandled={() => setFocusThingId(null)}
          />
        </Tabs.Panel>
        <Tabs.Panel value="catalog">
          <CatalogView
            catalogItems={data.catalogItems}
            thingItems={data.thingItems}
            things={data.things}
            onUpdateCatalogItem={updateCatalogItem}
            onDeleteCatalogItem={deleteCatalogItem}
            onJumpToThing={jumpToThing}
          />
        </Tabs.Panel>
        <Tabs.Panel value="export">
          <ExportView data={data} />
        </Tabs.Panel>
      </Tabs>

      <Group
        justify="space-between"
        mt="xl"
        pt="md"
        style={{ borderTop: '1px solid var(--mantine-color-gray-3)' }}
      >
        <Text size="xs" c="dimmed">
          {data.things.length} things · {data.catalogItems.length} catalog items ·{' '}
          {data.thingItems.length} item links
        </Text>
        <Button size="xs" variant="subtle" color="red" onClick={() => setResetOpen(true)}>
          Reset to seed
        </Button>
      </Group>

      <Modal opened={resetOpen} onClose={() => setResetOpen(false)} title="Reset to seed" centered>
        <Text mb="md">
          Discard <strong>all</strong> current data and reload the original seed? Export a backup
          first if you want to keep it. This can’t be undone.
        </Text>
        <Group justify="flex-end">
          <Button variant="default" onClick={() => setResetOpen(false)}>
            Cancel
          </Button>
          <Button
            color="red"
            onClick={() => {
              resetToSeed()
              setResetOpen(false)
            }}
          >
            Reset
          </Button>
        </Group>
      </Modal>
    </Container>
  )
}
