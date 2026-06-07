import { useState } from 'react'
import { Badge, Box, Collapse, Group, Stack, Text, Title, UnstyledButton } from '@mantine/core'
import type { Thing } from '../types'

interface SubGroup {
  subCategory: string
  things: Thing[]
}
interface CatGroup {
  category: string
  count: number
  subGroups: SubGroup[]
}

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

function Chevron({ open }: { open: boolean }) {
  return (
    <Text component="span" c="dimmed" style={{ width: 14, display: 'inline-block' }}>
      {open ? '▾' : '▸'}
    </Text>
  )
}

export function BrainstormView({ things }: { things: Thing[] }) {
  const groups = groupThings(things)
  // Categories open by default; subcategories collapsed (counts visible to scan).
  const [openCats, setOpenCats] = useState<Set<string>>(
    () => new Set(groups.map((g) => g.category)),
  )
  const [openSubs, setOpenSubs] = useState<Set<string>>(new Set())

  function toggle(set: Set<string>, setter: (s: Set<string>) => void, key: string) {
    const next = new Set(set)
    if (next.has(key)) next.delete(key)
    else next.add(key)
    setter(next)
  }

  return (
    <div>
      <Title order={2} mb="md">
        Brainstorm
      </Title>

      <Stack gap="xs">
        {groups.map((cat) => {
          const catOpen = openCats.has(cat.category)
          return (
            <Box key={cat.category}>
              <UnstyledButton onClick={() => toggle(openCats, setOpenCats, cat.category)}>
                <Group gap="xs">
                  <Chevron open={catOpen} />
                  <Text fw={700}>{cat.category}</Text>
                  <Badge variant="light" color="gray">
                    {cat.count}
                  </Badge>
                </Group>
              </UnstyledButton>

              <Collapse in={catOpen}>
                <Stack gap={4} pl="lg" pt={4}>
                  {cat.subGroups.map((sub) => {
                    const subKey = `${cat.category}›${sub.subCategory}`
                    const subOpen = openSubs.has(subKey)
                    return (
                      <Box key={subKey}>
                        <UnstyledButton onClick={() => toggle(openSubs, setOpenSubs, subKey)}>
                          <Group gap="xs">
                            <Chevron open={subOpen} />
                            <Text fw={500}>{sub.subCategory}</Text>
                            <Badge variant="light" color="gray" size="sm">
                              {sub.things.length}
                            </Badge>
                          </Group>
                        </UnstyledButton>

                        <Collapse in={subOpen}>
                          <Stack gap={2} pl="lg" pt={2}>
                            {sub.things.map((t) => (
                              <Text key={t.id} size="sm">
                                {t.name}
                              </Text>
                            ))}
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
    </div>
  )
}
