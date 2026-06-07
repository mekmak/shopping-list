import { useEffect, useState } from 'react'
import seed from '../seed.json'
import type { Dataset } from './types'

const STORAGE_KEY = 'event-shopping-list/v1'

/** The seed hierarchy generated from the planning doc. */
export const SEED_DATA = seed as Dataset

function loadInitial(): Dataset {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (raw) {
    try {
      return JSON.parse(raw) as Dataset
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
