import { useState } from 'react'

type Tab = 'brainstorm' | 'catalog' | 'export'

const TABS: { id: Tab; label: string }[] = [
  { id: 'brainstorm', label: 'Brainstorm' },
  { id: 'catalog', label: 'Catalog' },
  { id: 'export', label: 'Export' },
]

function Placeholder({ title }: { title: string }) {
  return (
    <div className="placeholder">
      <h2>{title}</h2>
      <p>Coming soon.</p>
    </div>
  )
}

export default function App() {
  const [tab, setTab] = useState<Tab>('brainstorm')

  return (
    <div className="app">
      <header className="app-header">
        <h1>Event Shopping List</h1>
        <nav className="tabs">
          {TABS.map((t) => (
            <button
              key={t.id}
              className={'tab' + (tab === t.id ? ' tab-active' : '')}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </header>

      <main className="app-main">
        {tab === 'brainstorm' && <Placeholder title="Brainstorm" />}
        {tab === 'catalog' && <Placeholder title="Catalog" />}
        {tab === 'export' && <Placeholder title="Export" />}
      </main>
    </div>
  )
}
