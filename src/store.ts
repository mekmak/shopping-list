import { useEffect, useState } from 'react'
import seed from '../seed.json'
import type { Category, Dataset, Thing } from './types'

const STORAGE_KEY = 'event-shopping-list/v1'

/** Dataset as it may exist before the taxonomy migration (categories optional). */
type RawDataset = Omit<Dataset, 'categories'> & { categories?: Category[] }

/** Derive an ordered taxonomy from things, by first appearance. */
function deriveCategories(things: Thing[]): Category[] {
  const cats: Category[] = []
  const byName = new Map<string, Category>()
  for (const t of things) {
    let c = byName.get(t.category)
    if (!c) {
      c = { name: t.category, subCategories: [] }
      byName.set(t.category, c)
      cats.push(c)
    }
    if (!c.subCategories.includes(t.subCategory)) c.subCategories.push(t.subCategory)
  }
  return cats
}

/**
 * Ensure the dataset has a `categories` taxonomy that covers every thing.
 * Migrates older saves (no taxonomy) and the seed (which omits it).
 */
function normalizeDataset(d: RawDataset): Dataset {
  const cats: Category[] = (d.categories ?? []).map((c) => ({
    name: c.name,
    subCategories: [...c.subCategories],
  }))
  const byName = new Map(cats.map((c) => [c.name, c]))
  for (const t of d.things) {
    let c = byName.get(t.category)
    if (!c) {
      c = { name: t.category, subCategories: [] }
      byName.set(t.category, c)
      cats.push(c)
    }
    if (!c.subCategories.includes(t.subCategory)) c.subCategories.push(t.subCategory)
  }
  return { ...d, categories: cats.length ? cats : deriveCategories(d.things) }
}

/** The seed hierarchy generated from the planning doc. */
export const SEED_DATA = normalizeDataset(seed as RawDataset)

function loadInitial(): Dataset {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (raw) {
    try {
      return normalizeDataset(JSON.parse(raw) as RawDataset)
    } catch {
      // Corrupt storage — fall back to seed rather than crashing.
    }
  }
  return SEED_DATA
}

/**
 * Holds the full dataset in React state, seeded on first run and
 * persisted to localStorage on every change.
 */
export function useDataset() {
  const [data, setData] = useState<Dataset>(loadInitial)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  }, [data])

  /** Wipe localStorage and reload the original seed (dev/testing aid). */
  function resetToSeed() {
    localStorage.removeItem(STORAGE_KEY)
    setData(SEED_DATA)
  }

  return { data, setData, resetToSeed }
}
