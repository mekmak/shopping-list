import { useEffect, useRef, useState } from 'react'
import seed from '../seed.json'
import type { Category, Dataset, Thing } from './types'

const STORAGE_KEY = 'event-shopping-list/v1'
const DEFAULT_TITLE = 'Birthday Bash'

/** Dataset as it may exist before migrations (title/categories optional). */
type RawDataset = Omit<Dataset, 'categories' | 'title'> & {
  categories?: Category[]
  title?: string
}

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
  const title = typeof d.title === 'string' && d.title.trim() ? d.title : DEFAULT_TITLE
  return { ...d, title, categories: cats.length ? cats : deriveCategories(d.things) }
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

  // Persist on idle (debounced) so rapid edits don't stringify on every keystroke.
  const dataRef = useRef(data)
  dataRef.current = data
  useEffect(() => {
    const id = setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataRef.current))
    }, 400)
    return () => clearTimeout(id)
  }, [data])
  // Flush immediately if the page is closing, so nothing in the debounce window is lost.
  useEffect(() => {
    const flush = () => localStorage.setItem(STORAGE_KEY, JSON.stringify(dataRef.current))
    window.addEventListener('beforeunload', flush)
    return () => window.removeEventListener('beforeunload', flush)
  }, [])

  /** Wipe localStorage and reload the original seed (dev/testing aid). */
  function resetToSeed() {
    localStorage.removeItem(STORAGE_KEY)
    setData(SEED_DATA)
  }

  /** Serialize the full dataset for a backup file. */
  function exportJson(): string {
    return JSON.stringify(data, null, 2)
  }

  /** Replace all data from a backup file's JSON text. */
  function importJson(text: string): { ok: true } | { ok: false; error: string } {
    let parsed: unknown
    try {
      parsed = JSON.parse(text)
    } catch {
      return { ok: false, error: 'That file is not valid JSON.' }
    }
    if (typeof parsed !== 'object' || parsed === null || !Array.isArray((parsed as RawDataset).things)) {
      return { ok: false, error: "That doesn't look like a backup (no \"things\" array)." }
    }
    const p = parsed as Partial<RawDataset>
    const raw: RawDataset = {
      version: typeof p.version === 'number' ? p.version : 1,
      title: typeof p.title === 'string' ? p.title : undefined,
      categories: Array.isArray(p.categories) ? p.categories : undefined,
      things: Array.isArray(p.things) ? p.things : [],
      catalogItems: Array.isArray(p.catalogItems) ? p.catalogItems : [],
      thingItems: Array.isArray(p.thingItems) ? p.thingItems : [],
    }
    setData(normalizeDataset(raw))
    return { ok: true }
  }

  return { data, setData, resetToSeed, exportJson, importJson }
}
