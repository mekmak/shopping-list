import { useState, type ReactNode } from 'react'
import { useDisclosure } from '@mantine/hooks'
import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Collapse,
  Group,
  Menu,
  Modal,
  Select,
  Stack,
  Text,
  Textarea,
  TextInput,
  Title,
} from '@mantine/core'
import type { Category, Thing } from '../types'

interface BrainstormViewProps {
  categories: Category[]
  things: Thing[]
  onUpdateThing: (id: string, patch: Partial<Thing>) => void
  onAddThing: (category: string, subCategory: string, name: string) => void
  onDeleteThing: (id: string) => void
  onAddCategory: (name: string) => void
  onRenameCategory: (oldName: string, newName: string) => void
  onDeleteCategory: (name: string, moveTo?: string) => void
  onAddSubCategory: (category: string, name: string) => void
  onRenameSubCategory: (category: string, oldName: string, newName: string) => void
  onDeleteSubCategory: (category: string, name: string, moveTo?: string) => void
}

const SEP = ' › '
const subKeyOf = (category: string, subCategory: string) => `${category}${SEP}${subCategory}`

type Dialog =
  | { kind: 'renameCategory'; category: string }
  | { kind: 'deleteCategory'; category: string }
  | { kind: 'renameSubCategory'; category: string; subCategory: string }
  | { kind: 'deleteSubCategory'; category: string; subCategory: string }
  | null

function Chevron({ open }: { open: boolean }) {
  return (
    <Text component="span" c="dimmed" style={{ width: 14, display: 'inline-block' }}>
      {open ? '▾' : '▸'}
    </Text>
  )
}

export function BrainstormView(props: BrainstormViewProps) {
  const { categories, things } = props
  const [query, setQuery] = useState('')
  const [openCats, setOpenCats] = useState<Set<string>>(
    () => new Set(categories.map((c) => c.name)),
  )
  const [openSubs, setOpenSubs] = useState<Set<string>>(new Set())
  const [openThings, setOpenThings] = useState<Set<string>>(new Set())
  const [dialog, setDialog] = useState<Dialog>(null)

  const q = query.trim().toLowerCase()
  const searching = q.length > 0
  const visible = searching ? things.filter((t) => t.name.toLowerCase().includes(q)) : things

  // Move targets for the per-thing move dropdown (includes empty groups).
  const moveTargets = categories.flatMap((c) =>
    c.subCategories.map((s) => subKeyOf(c.name, s)),
  )

  const isCatOpen = (c: string) => searching || openCats.has(c)
  const isSubOpen = (k: string) => searching || openSubs.has(k)

  function toggle(set: Set<string>, setter: (s: Set<string>) => void, key: string) {
    const next = new Set(set)
    if (next.has(key)) next.delete(key)
    else next.add(key)
    setter(next)
  }

  function expandAll() {
    setOpenCats(new Set(categories.map((c) => c.name)))
    setOpenSubs(
      new Set(categories.flatMap((c) => c.subCategories.map((s) => subKeyOf(c.name, s)))),
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

      <Stack gap="xs">
        {categories.map((cat) => {
          const catThings = visible.filter((t) => t.category === cat.name)
          if (searching && catThings.length === 0) return null
          const catOpen = isCatOpen(cat.name)
          return (
            <Box key={cat.name}>
              <Group gap="xs" wrap="nowrap">
                <UnstyledToggle onClick={() => toggle(openCats, setOpenCats, cat.name)}>
                  <Chevron open={catOpen} />
                  <Text fw={700}>{cat.name}</Text>
                  <Badge variant="light" color="gray">
                    {catThings.length}
                  </Badge>
                </UnstyledToggle>
                <RowMenu
                  onRename={() => setDialog({ kind: 'renameCategory', category: cat.name })}
                  onDelete={() => setDialog({ kind: 'deleteCategory', category: cat.name })}
                />
              </Group>

              <Collapse in={catOpen}>
                <Stack gap={4} pl="lg" pt={4}>
                  {cat.subCategories.map((sub) => {
                    const subThings = catThings.filter((t) => t.subCategory === sub)
                    if (searching && subThings.length === 0) return null
                    const subKey = subKeyOf(cat.name, sub)
                    const subOpen = isSubOpen(subKey)
                    return (
                      <Box key={subKey}>
                        <Group gap="xs" wrap="nowrap">
                          <UnstyledToggle onClick={() => toggle(openSubs, setOpenSubs, subKey)}>
                            <Chevron open={subOpen} />
                            <Text fw={500}>{sub}</Text>
                            <Badge variant="light" color="gray" size="sm">
                              {subThings.length}
                            </Badge>
                          </UnstyledToggle>
                          <RowMenu
                            onRename={() =>
                              setDialog({
                                kind: 'renameSubCategory',
                                category: cat.name,
                                subCategory: sub,
                              })
                            }
                            onDelete={() =>
                              setDialog({
                                kind: 'deleteSubCategory',
                                category: cat.name,
                                subCategory: sub,
                              })
                            }
                          />
                        </Group>

                        <Collapse in={subOpen}>
                          <Stack gap={2} pl="lg" pt={2}>
                            {subThings.map((t) => (
                              <ThingRow
                                key={t.id}
                                thing={t}
                                open={openThings.has(t.id)}
                                moveTargets={moveTargets}
                                onToggle={() => toggle(openThings, setOpenThings, t.id)}
                                onUpdateThing={props.onUpdateThing}
                                onDeleteThing={props.onDeleteThing}
                              />
                            ))}
                            {!searching && (
                              <QuickAdd
                                placeholder="+ Add a thing…"
                                onAdd={(name) => props.onAddThing(cat.name, sub, name)}
                              />
                            )}
                          </Stack>
                        </Collapse>
                      </Box>
                    )
                  })}
                  {!searching && (
                    <QuickAdd
                      placeholder="+ Add a subcategory…"
                      onAdd={(name) => props.onAddSubCategory(cat.name, name)}
                    />
                  )}
                </Stack>
              </Collapse>
            </Box>
          )
        })}
        {!searching && (
          <QuickAdd placeholder="+ Add a category…" onAdd={(name) => props.onAddCategory(name)} />
        )}
      </Stack>

      {/* Rename / delete dialogs */}
      {dialog?.kind === 'renameCategory' && (
        <RenameModal
          title="Rename category"
          initial={dialog.category}
          onClose={() => setDialog(null)}
          onSave={(name) => props.onRenameCategory(dialog.category, name)}
        />
      )}
      {dialog?.kind === 'renameSubCategory' && (
        <RenameModal
          title="Rename subcategory"
          initial={dialog.subCategory}
          onClose={() => setDialog(null)}
          onSave={(name) => props.onRenameSubCategory(dialog.category, dialog.subCategory, name)}
        />
      )}
      {dialog?.kind === 'deleteCategory' && (
        <DeleteGroupModal
          title="Delete category"
          label={dialog.category}
          count={things.filter((t) => t.category === dialog.category).length}
          targetLabel="Move its things to category"
          targets={categories.map((c) => c.name).filter((n) => n !== dialog.category)}
          onClose={() => setDialog(null)}
          onConfirm={(moveTo) => props.onDeleteCategory(dialog.category, moveTo)}
        />
      )}
      {dialog?.kind === 'deleteSubCategory' && (
        <DeleteGroupModal
          title="Delete subcategory"
          label={subKeyOf(dialog.category, dialog.subCategory)}
          count={
            things.filter(
              (t) => t.category === dialog.category && t.subCategory === dialog.subCategory,
            ).length
          }
          targetLabel="Move its things to subcategory"
          targets={(categories.find((c) => c.name === dialog.category)?.subCategories ?? []).filter(
            (s) => s !== dialog.subCategory,
          )}
          onClose={() => setDialog(null)}
          onConfirm={(moveTo) =>
            props.onDeleteSubCategory(dialog.category, dialog.subCategory, moveTo)
          }
        />
      )}
    </div>
  )
}

function RowMenu({ onRename, onDelete }: { onRename: () => void; onDelete: () => void }) {
  return (
    <Menu shadow="md" position="bottom-end" withinPortal>
      <Menu.Target>
        <ActionIcon variant="subtle" color="gray" aria-label="Group actions">
          ⋯
        </ActionIcon>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Item onClick={onRename}>Rename…</Menu.Item>
        <Menu.Item color="red" onClick={onDelete}>
          Delete…
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
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

function RenameModal({
  title,
  initial,
  onSave,
  onClose,
}: {
  title: string
  initial: string
  onSave: (name: string) => void
  onClose: () => void
}) {
  const [name, setName] = useState(initial)
  const trimmed = name.trim()
  function save() {
    if (trimmed) onSave(trimmed)
    onClose()
  }
  return (
    <Modal opened onClose={onClose} title={title} centered>
      <TextInput
        data-autofocus
        value={name}
        onChange={(e) => setName(e.currentTarget.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') save()
        }}
      />
      <Group justify="flex-end" mt="md">
        <Button variant="default" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={save} disabled={!trimmed}>
          Save
        </Button>
      </Group>
    </Modal>
  )
}

function DeleteGroupModal({
  title,
  label,
  count,
  targets,
  targetLabel,
  onConfirm,
  onClose,
}: {
  title: string
  label: string
  count: number
  targets: string[]
  targetLabel: string
  onConfirm: (moveTo?: string) => void
  onClose: () => void
}) {
  const [moveTo, setMoveTo] = useState<string | null>(null)
  const needsMove = count > 0
  const canMove = targets.length > 0
  const ready = !needsMove || (canMove && moveTo !== null)

  return (
    <Modal opened onClose={onClose} title={title} centered>
      {needsMove ? (
        canMove ? (
          <>
            <Text mb="sm">
              <strong>{label}</strong> has {count} thing{count === 1 ? '' : 's'}. Choose where
              to move them, then delete.
            </Text>
            <Select
              label={targetLabel}
              data={targets}
              value={moveTo}
              onChange={setMoveTo}
              placeholder="Select destination"
              comboboxProps={{ withinPortal: true }}
            />
          </>
        ) : (
          <Text mb="sm" c="red">
            <strong>{label}</strong> has {count} thing{count === 1 ? '' : 's'} and there's
            nowhere to move them. Create another destination first, or delete/move the things
            yourself.
          </Text>
        )
      ) : (
        <Text mb="sm">
          Delete <strong>{label}</strong>? It has no things.
        </Text>
      )}
      <Group justify="flex-end" mt="md">
        <Button variant="default" onClick={onClose}>
          Cancel
        </Button>
        <Button
          color="red"
          disabled={!ready}
          onClick={() => {
            onConfirm(needsMove ? moveTo ?? undefined : undefined)
            onClose()
          }}
        >
          Delete
        </Button>
      </Group>
    </Modal>
  )
}

/** Inline "add" input (things, subcategories, categories). */
function QuickAdd({ placeholder, onAdd }: { placeholder: string; onAdd: (name: string) => void }) {
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
        placeholder={placeholder}
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
        flex: 1,
        minWidth: 0,
      }}
    >
      {children}
    </Box>
  )
}
