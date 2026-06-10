import type { Dataset } from '../types'

/** A renderable block — used for both the preview and the Markdown string. */
export type Block =
  | { type: 'heading'; level: 1 | 2 | 3; text: string }
  | { type: 'item'; text: string; note?: string }
  | { type: 'subitem'; text: string; note?: string }

export interface ExportOptions {
  amounts: boolean
  notes: boolean
  checkboxes: boolean
  /** By-store only: list the things each merged item is for, under it. */
  sources: boolean
}

export const DEFAULT_OPTIONS: ExportOptions = {
  amounts: true,
  notes: true,
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
  sources: { name: string; amount: string; notes: string }[]
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
    const t = thingById.get(ti.thingId)
    entry.amounts.push(ti.amount)
    entry.sources.push({
      name: t?.name ?? '(unknown)',
      amount: ti.amount,
      notes: t?.notes ?? '',
    })
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
      // A single-item thing named after the item: its source line would just
      // repeat the item, so fold any note onto the item row and skip the subitem.
      const redundant =
        it.sources.length === 1 &&
        it.sources[0].name.trim().toLowerCase() === it.name.trim().toLowerCase()
      const foldedNote =
        redundant && opts.notes && it.sources[0].notes.trim()
          ? it.sources[0].notes.trim().replace(/\s*\n\s*/g, ' ')
          : undefined
      blocks.push({
        type: 'item',
        text: itemLabel(it.name, combineAmounts(it.amounts, it.unit), opts),
        note: foldedNote,
      })
      if (opts.sources && !redundant) {
        for (const s of it.sources) {
          let text = s.name
          if (opts.amounts && s.amount.trim()) text += ` (${s.amount.trim()})`
          const note =
            opts.notes && s.notes.trim() ? s.notes.trim().replace(/\s*\n\s*/g, ' ') : undefined
          blocks.push({ type: 'subitem', text, note })
        }
      }
    }
  }
  return blocks
}

/** Menu: things bulleted under their category → subcategory headings (no items). */
export function buildCategoryBlocks(data: Dataset, opts: ExportOptions): Block[] {
  const blocks: Block[] = []

  for (const cat of data.categories) {
    const catBlocks: Block[] = []
    for (const sub of cat.subCategories) {
      const subThings = data.things.filter(
        (t) => t.category === cat.name && t.subCategory === sub,
      )
      if (subThings.length === 0) continue
      catBlocks.push({ type: 'heading', level: 3, text: sub })
      for (const t of subThings) {
        const note =
          opts.notes && t.notes.trim() ? t.notes.trim().replace(/\s*\n\s*/g, ' ') : undefined
        catBlocks.push({ type: 'item', text: t.name, note })
      }
    }
    if (catBlocks.length === 0) continue
    blocks.push({ type: 'heading', level: 2, text: cat.name })
    blocks.push(...catBlocks)
  }
  return blocks
}

/**
 * Render a note as an italic Markdown suffix. Item rows put it in parens (their
 * amount already uses an em-dash); subitem rows use an em-dash (their amount is
 * already parenthesized) — so each line type stays unambiguous.
 */
function itemNote(note?: string): string {
  return note ? ` _(${note})_` : ''
}
function subitemNote(note?: string): string {
  return note ? ` — _${note}_` : ''
}

/** Serialize blocks to Markdown (task-list checkboxes optional). */
export function blocksToMarkdown(blocks: Block[], opts: ExportOptions): string {
  const lines: string[] = []
  for (const b of blocks) {
    if (b.type === 'heading') {
      if (lines.length) lines.push('')
      const hashes = '#'.repeat(Math.min(b.level + 3, 6))
      lines.push(`${hashes} ${b.text}`)
    } else if (b.type === 'subitem') {
      lines.push(`  - ${b.text}${subitemNote(b.note)}`)
    } else {
      lines.push(`- ${opts.checkboxes ? '[ ] ' : ''}${b.text}${itemNote(b.note)}`)
    }
  }
  return lines.join('\n').trim() + '\n'
}
