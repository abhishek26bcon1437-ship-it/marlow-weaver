import { useMemo, useState } from 'react'
import type { Category } from '../types'
import { formatNumber } from '../lib/format'
import { inventorySummary } from '../store/reducer'
import { useStore } from '../store/StoreProvider'
import { ProductCard } from './ProductCard'
import type { ToastTone } from './Toasts'

type SortKey = 'featured' | 'price-asc' | 'price-desc' | 'stock-desc' | 'name'

const SORTS: { value: SortKey; label: string }[] = [
  { value: 'featured', label: 'Featured' },
  { value: 'price-asc', label: 'Price: low to high' },
  { value: 'price-desc', label: 'Price: high to low' },
  { value: 'stock-desc', label: 'Most in stock' },
  { value: 'name', label: 'Name A–Z' },
]

export function Shop({ notify }: { notify: (message: string, tone?: ToastTone) => void }) {
  const { state } = useStore()
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<Category | 'All'>('All')
  const [sort, setSort] = useState<SortKey>('featured')
  const [inStockOnly, setInStockOnly] = useState(false)

  const categories = useMemo(
    () => Array.from(new Set(state.products.map((product) => product.category))).sort(),
    [state.products],
  )

  const summary = useMemo(() => inventorySummary(state.products), [state.products])

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase()
    const filtered = state.products.filter((product) => {
      if (category !== 'All' && product.category !== category) return false
      if (inStockOnly && product.stock <= 0) return false
      if (!needle) return true
      return [product.name, product.sku, product.category, product.composition, product.description, ...product.tags]
        .join(' ')
        .toLowerCase()
        .includes(needle)
    })

    const sorted = [...filtered]
    sorted.sort((a, b) => {
      if (sort === 'price-asc') return a.price - b.price
      if (sort === 'price-desc') return b.price - a.price
      if (sort === 'stock-desc') return b.stock - a.stock
      if (sort === 'name') return a.name.localeCompare(b.name)
      return 0
    })
    return sorted
  }, [state.products, query, category, sort, inStockOnly])

  return (
    <section id="shop" className="view">
      <div className="hero">
        <div className="shell hero__inner">
          <div className="hero__copy">
            <p className="eyebrow">Est. 1948 · Yorkshire &amp; Lisbon mills</p>
            <h1>
              Cloth worth
              <br />
              building a home around.
            </h1>
            <p className="hero__lede">
              Mill-direct upholstery and apparel fabrics by the metre, alongside washed-linen bedding, bath and table
              linens. Every roll traceable, every order cut by hand.
            </p>
            <div className="hero__actions">
              <a className="button button--primary" href="#catalogue">
                Browse the catalogue
              </a>
              <span className="hero__note">Free delivery over $150 · Swatches available on request</span>
            </div>
          </div>

          <dl className="hero__stats">
            <div>
              <dt>Fabric lines</dt>
              <dd>{formatNumber(summary.skus)}</dd>
            </div>
            <div>
              <dt>Units on hand</dt>
              <dd>{formatNumber(summary.units)}</dd>
            </div>
            <div>
              <dt>Categories</dt>
              <dd>{summary.categories}</dd>
            </div>
            <div>
              <dt>Ready to ship</dt>
              <dd>{state.products.length - summary.outCount}</dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="shell">
        <div id="catalogue" className="catalogue-head">
          <div>
            <h2>The catalogue</h2>
            <p>
              {visible.length} of {state.products.length} lines
              {category !== 'All' && <> in {category}</>}
              {inStockOnly && ' · in stock only'}
            </p>
          </div>

          <div className="toolbar">
            <label className="field field--search">
              <span className="sr-only">Search the catalogue</span>
              <input
                type="search"
                placeholder="Search linen, bouclé, table…"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </label>
            <label className="field">
              <span className="sr-only">Sort products</span>
              <select value={sort} onChange={(event) => setSort(event.target.value as SortKey)}>
                {SORTS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="toggle">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(event) => setInStockOnly(event.target.checked)}
              />
              <span>In stock only</span>
            </label>
          </div>
        </div>

        <div className="pills" role="group" aria-label="Filter by category">
          <button
            type="button"
            className={`pill${category === 'All' ? ' is-active' : ''}`}
            onClick={() => setCategory('All')}
            aria-pressed={category === 'All'}
          >
            All fabrics &amp; linens
          </button>
          {categories.map((item) => (
            <button
              key={item}
              type="button"
              className={`pill${category === item ? ' is-active' : ''}`}
              onClick={() => setCategory(item)}
              aria-pressed={category === item}
            >
              {item}
            </button>
          ))}
        </div>

        {visible.length === 0 ? (
          <div className="empty">
            <h3>No lines match that search</h3>
            <p>Try a different weave, or reset the filters to see the full catalogue.</p>
            <button
              type="button"
              className="button"
              onClick={() => {
                setQuery('')
                setCategory('All')
                setInStockOnly(false)
              }}
            >
              Reset filters
            </button>
          </div>
        ) : (
          <div className="grid">
            {visible.map((product) => (
              <ProductCard key={product.id} product={product} notify={notify} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
