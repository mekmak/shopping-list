/** A thing you want at the event (categorized; may be composed of items). */
export interface Thing {
  id: string
  name: string
  category: string
  subCategory: string
  notes: string
}

/** A canonical, reusable purchasable item shared across things. */
export interface CatalogItem {
  id: string
  name: string
  /** the "amount type": bottle / can / melon / bag … */
  unit: string
  /** where it's bought; '' means unknown */
  defaultStore: string
}

/** Link: a catalog item used by a thing, with a per-usage amount. */
export interface ThingItem {
  thingId: string
  catalogItemId: string
  /** free text: "30", "TBD", "lots", "a splash" */
  amount: string
}

/** The full app dataset (also the shape of seed.json and JSON backups). */
export interface Dataset {
  version: number
  things: Thing[]
  catalogItems: CatalogItem[]
  thingItems: ThingItem[]
}
