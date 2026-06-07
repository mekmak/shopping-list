import type { Dataset } from '../types'

/** A renderable block — used for both the preview and the Markdown string. */
export type Block =
  | { type: 'heading'; level: 1 | 2 | 3; text: string; sub?: string }
  | { type: 'note'; text: string }
  | { type: 'item'; text: string }
  | { type: 'subitem'; text: string }

export interface ExportOptions {
  amounts: boolean
  notes: boolean
  skipEmpty: boolean
  checkboxes: boolean
  /** By-store only: list the things each merged item is for, under it. */
  sources: boolean
}

export const DEFAULT_OPTIONS: ExportOptions = {
  amounts: true,
  notes: true,
  skipEmpty: true,
  checkboxes: true,
  sources: true,
}

const UNKNOWN_STORE = 'Unknown store'

/**
 * Combine a catalog item's per-usage amounts: sum the numeric ones (with unit),
 * keep non-numeric ones (e.g. "lots", "TBD") verbatim.
 */
export function combineAmounts(amounts: string[], unit: string): string {
  let sum = 0
  let hasNumber = false
  const others: string[] = []
  for (const raw of amounts) {
    const s = raw.trim()
    if (!s) continue
    const n = Number(s)
    if (!Number.isNaN(n)) {
      sum += n
      hasNumber = true
    } else {
      others.push(s)
    }
  }
  const parts: string[] = []
  if (hasNumber) parts.push(unit ? `${sum} ${unit}` : `${sum}`)
  parts.push(...others)
  return parts.join(' + ')
}

function itemLabel(name: string, amount: string, opts: ExportOptions): string {
  return opts.amounts && amount.trim() ? `${name} — ${amount.trim()}` : name
}

interface StoreItem {
  name: string
  unit: string
  amounts: string[]
  sources: { name: string; amount: string }[]
}

/** By Store: items merged across things, amounts summed, grouped by store. */
export function buildStoreBlocks(data: Dataset, opts: ExportOptions): Block[] {
  const catalogById = new Map(data.catalogItems.map((ci) => [ci.id, ci]))
  const thingById = new Map(data.things.map((t) => [t.id, t]))
  const byStore = new Map<string, Map<string, StoreItem>>()

  for (const ti of data.thingItems) {
    const ci = catalogById.get(ti.catalogItemId)
    if (!ci) continue
    const store = ci.defaultStore.trim() || UNKNOWN_STORE
    let items = byStore.get(store)
    if (!items) {
      items = new Map()
      byStore.set(store, items)
    }
    const entry = items.get(ci.id) ?? { name: ci.name, unit: ci.unit, amounts: [], sources: [] }
    entry.amounts.push(ti.amount)
    entry.sources.push({ name: thingById.get(ti.thingId)?.name ?? '(unknown)', amount: ti.amount })
    items.set(ci.id, entry)
  }

  const stores = [...byStore.keys()].sort((a, b) => {
    if (a === UNKNOWN_STORE) return 1
    if (b === UNKNOWN_STORE) return -1
    return a.localeCompare(b)
  })

  const blocks: Block[] = []
  for (const store of stores) {
    blocks.push({ type: 'heading', level: 2, text: store })
    const items = [...byStore.get(store)!.values()].sort((a, b) => a.name.localeCompare(b.name))
    for (const it of items) {
      blocks.push({ type: 'item', text: itemLabel(it.name, combineAmounts(it.amounts, it.unit), opts) })
      if (opts.sources && it.sources.length > 0) {
        const list = it.sources
          .map((s) => (opts.amounts && s.amount.trim() ? `${s.name} (${s.amount.trim()})` : s.name))
          .join(', ')
        blocks.push({ type: 'subitem', text: `for ${list}` })
      }
    }
  }
  return blocks
}

/** By Thing: each thing (with notes) and its items; no merging. */
export function buildThingBlocks(data: Dataset, opts: ExportOptions): Block[] {
  const catalogById = new Map(data.catalogItems.map((ci) => [ci.id, ci]))
  const blocks: Block[] = []
  for (const t of data.things) {
    const items = data.thingItems.filter((ti) => ti.thingId === t.id)
    if (opts.skipEmpty && items.length === 0) continue
    blocks.push({
      type: 'heading',
      level: 2,
      text: t.name,
      sub: `${t.category} › ${t.subCategory}`,
    })
    if (opts.notes && t.notes.trim()) blocks.push({ type: 'note', text: t.notes.trim() })
    for (const ti of items) {
      const name = catalogById.get(ti.catalogItemId)?.name ?? '(unknown)'
      blocks.push({ type: 'item', text: itemLabel(name, ti.amount, opts) })
    }
  }
  return blocks
}

/** By Category → Subcategory: things grouped under their taxonomy headings. */
export function buildCategoryBlocks(data: Dataset, opts: ExportOptions): Block[] {
  const catalogById = new Map(data.catalogItems.map((ci) => [ci.id, ci]))
  const hasItems = (thingId: string) => data.thingItems.some((ti) => ti.thingId === thingId)
  const blocks: Block[] = []

  for (const cat of data.categories) {
    const catBlocks: Block[] = []
    for (const sub of cat.subCategories) {
      const subThings = data.things.filter(
        (t) =>
          t.category === cat.name &&
          t.subCategory === sub &&
          (!opts.skipEmpty || hasItems(t.id)),
      )
      if (subThings.length === 0) continue
      catBlocks.push({ type: 'heading', level: 2, text: sub })
      for (const t of subThings) {
        catBlocks.push({ type: 'heading', level: 3, text: t.name })
        if (opts.notes && t.notes.trim()) catBlocks.push({ type: 'note', text: t.notes.trim() })
        for (const ti of data.thingItems.filter((x) => x.thingId === t.id)) {
          const name = catalogById.get(ti.catalogItemId)?.name ?? '(unknown)'
          catBlocks.push({ type: 'item', text: itemLabel(name, ti.amount, opts) })
        }
      }
    }
    if (catBlocks.length === 0) continue
    blocks.push({ type: 'heading', level: 1, text: cat.name })
    blocks.push(...catBlocks)
  }
  return blocks
}

/** Serialize blocks to Markdown (task-list checkboxes optional). */
export function blocksToMarkdown(blocks: Block[], opts: ExportOptions): string {
  const lines: string[] = []
  for (const b of blocks) {
    if (b.type === 'heading') {
      if (lines.length) lines.push('')
      lines.push(`${'#'.repeat(b.level)} ${b.text}${b.sub ? `  _(${b.sub})_` : ''}`)
    } else if (b.type === 'note') {
      lines.push(`> ${b.text}`)
    } else if (b.type === 'subitem') {
      lines.push(`  - ${b.text}`)
    } else {
      lines.push(`- ${opts.checkboxes ? '[ ] ' : ''}${b.text}`)
    }
  }
  return lines.join('\n').trim() + '\n'
}
