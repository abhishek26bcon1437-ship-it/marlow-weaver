import { useEffect, useMemo, useState } from 'react'
import { formatDateTime, formatMoney, formatMoneyCompact, formatNumber, unitShort } from '../lib/format'
import { inventorySummary, statusLabel, stockStatus } from '../store/reducer'
import { useStore } from '../store/StoreProvider'
import type { Category, Product, StockStatus } from '../types'
import type { ToastTone } from './Toasts'

type StatusFilter = StockStatus | 'all'

interface InventoryProps {
  notify: (message: string, tone?: ToastTone) => void
}

export function Inventory({ notify }: InventoryProps) {
  const { state, dispatch } = useStore()
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<Category | 'all'>('all')
  const [status, setStatus] = useState<StatusFilter>('all')

  const summary = useMemo(() => inventorySummary(state.products), [state.products])
  const categories = useMemo(
    () => Array.from(new Set(state.products.map((product) => product.category))).sort(),
    [state.products],
  )

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return state.products.filter((product) => {
      if (category !== 'all' && product.category !== category) return false
      if (status !== 'all' && stockStatus(product) !== status) return false
      if (!needle) return true
      return `${product.name} ${product.sku} ${product.category} ${product.composition}`
        .toLowerCase()
        .includes(needle)
    })
  }, [state.products, query, category, status])

  function exportCsv() {
    const header = ['SKU', 'Product', 'Category', 'Unit', 'Price', 'Stock', 'Low stock at', 'Status', 'Stock value']
    const lines = rows.map((product) => [
      product.sku,
      product.name,
      product.category,
      product.unit,
      product.price.toFixed(2),
      String(product.stock),
      String(product.lowStockThreshold),
      statusLabel(stockStatus(product)),
      (product.price * product.stock).toFixed(2),
    ])
    const csv = [header, ...lines]
      .map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(','))
      .join('\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    const link = document.createElement('a')
    link.href = url
    link.download = 'marlow-weaver-inventory.csv'
    link.click()
    URL.revokeObjectURL(url)
    notify(`Exported ${rows.length} inventory rows to CSV`, 'info')
  }

  function restockLow() {
    if (summary.lowCount + summary.outCount === 0) {
      notify('Nothing to reorder — no lines are below their threshold', 'info')
      return
    }
    dispatch({ type: 'RESTOCK_LOW' })
    notify(`Reorder run recorded for ${summary.lowCount + summary.outCount} line(s)`, 'success')
  }

  function resetInventory() {
    dispatch({ type: 'RESET_INVENTORY' })
    notify('Inventory restored to the opening catalogue counts', 'info')
  }

  return (
    <section id="inventory" className="view">
      <div className="shell">
        <div className="panel-head">
          <div>
            <p className="eyebrow">Back office</p>
            <h1>Inventory management</h1>
            <p className="panel-head__lede">
              Stock moves as customers order: placing an order deducts units and writes a line to the movement log.
              Adjust counts here, or run a reorder for everything under its threshold.
            </p>
          </div>
          <div className="panel-head__actions">
            <button type="button" className="button" onClick={exportCsv}>
              Export CSV
            </button>
            <button type="button" className="button button--ghost" onClick={resetInventory}>
              Reset demo data
            </button>
          </div>
        </div>

        <div className="kpis">
          <Kpi label="Fabric & linen lines" value={formatNumber(summary.skus)} hint={`${summary.categories} categories`} />
          <Kpi label="Units on hand" value={formatNumber(summary.units)} hint="Across all colourways" />
          <Kpi label="Stock value at retail" value={formatMoneyCompact(summary.value)} hint="Units × list price" />
          <Kpi
            label="Needs reorder"
            value={formatNumber(summary.lowCount + summary.outCount)}
            hint={`${summary.lowCount} low · ${summary.outCount} sold out`}
            tone={summary.lowCount + summary.outCount > 0 ? 'warn' : 'good'}
          />
        </div>

        {(summary.lowCount > 0 || summary.outCount > 0) && (
          <div className="alert">
            <span className="alert__dot" aria-hidden="true" />
            <p>
              <strong>{summary.lowCount + summary.outCount} line(s)</strong> are at or below their reorder threshold.
            </p>
            <button type="button" className="button button--primary button--sm" onClick={restockLow}>
              Run reorder
            </button>
          </div>
        )}

        <div className="toolbar toolbar--panel">
          <label className="field field--search">
            <span className="sr-only">Search inventory</span>
            <input
              type="search"
              placeholder="Search SKU, product, weave…"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
          <label className="field">
            <span className="sr-only">Filter by category</span>
            <select value={category} onChange={(event) => setCategory(event.target.value as Category | 'all')}>
              <option value="all">All categories</option>
              {categories.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span className="sr-only">Filter by stock status</span>
            <select value={status} onChange={(event) => setStatus(event.target.value as StatusFilter)}>
              <option value="all">Any status</option>
              <option value="in">In stock</option>
              <option value="low">Low stock</option>
              <option value="out">Sold out</option>
            </select>
          </label>
        </div>

        <div className="table-wrap">
          <table className="table">
            <caption className="sr-only">Stock levels by product line</caption>
            <thead>
              <tr>
                <th scope="col">Product</th>
                <th scope="col">Category</th>
                <th scope="col">Price</th>
                <th scope="col">Low at</th>
                <th scope="col">Stock on hand</th>
                <th scope="col">Status</th>
                <th scope="col">Stock value</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((product) => (
                <tr key={product.id} className={stockStatus(product) === 'out' ? 'is-out' : undefined}>
                  <th scope="row">
                    <span className="table__name">{product.name}</span>
                    <span className="table__sku">
                      {product.sku} · {product.composition}
                    </span>
                  </th>
                  <td>{product.category}</td>
                  <td>
                    <NumberCell
                      value={product.price}
                      step={0.5}
                      decimals
                      onCommit={(value) => {
                        dispatch({ type: 'UPDATE_PRODUCT', productId: product.id, patch: { price: value } })
                        notify(`${product.name} price set to ${formatMoney(value)}`, 'info')
                      }}
                      label={`Price for ${product.name}`}
                    />
                  </td>
                  <td>
                    <NumberCell
                      value={product.lowStockThreshold}
                      step={1}
                      onCommit={(value) =>
                        dispatch({
                          type: 'UPDATE_PRODUCT',
                          productId: product.id,
                          patch: { lowStockThreshold: value },
                        })
                      }
                      label={`Low stock threshold for ${product.name}`}
                    />
                  </td>
                  <td>
                    <StockEditor
                      product={product}
                      notify={notify}
                      onSet={(value) =>
                        dispatch({ type: 'SET_STOCK', productId: product.id, stock: value, note: 'Manual count — inventory panel' })
                      }
                      onAdjust={(delta) =>
                        dispatch({
                          type: 'ADJUST_STOCK',
                          productId: product.id,
                          delta,
                          note: delta > 0 ? 'Stock received — inventory panel' : 'Adjustment — inventory panel',
                        })
                      }
                    />
                  </td>
                  <td>
                    <StatusBadge status={stockStatus(product)} />
                  </td>
                  <td className="table__value">{formatMoney(product.price * product.stock)}</td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={7} className="table__empty">
                    No lines match these filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="log">
          <div className="log__head">
            <h2>Movement log</h2>
            <p>Most recent first · sales, receipts, corrections and resets</p>
          </div>
          {state.movements.length === 0 ? (
            <p className="log__empty">No movements recorded yet.</p>
          ) : (
            <ul className="log__list">
              {state.movements.slice(0, 12).map((movement) => (
                <li key={movement.id} className="log__item">
                  <span className={`delta delta--${movement.delta > 0 ? 'up' : 'down'}`}>
                    {movement.delta > 0 ? '+' : ''}
                    {movement.delta}
                  </span>
                  <div>
                    <p className="log__name">
                      {movement.name} <span className="log__sku">{movement.sku}</span>
                    </p>
                    <p className="log__meta">
                      {movement.reason} · {movement.note ?? 'No note'} · stock now {movement.stockAfter}
                    </p>
                  </div>
                  <time className="log__time" dateTime={new Date(movement.at).toISOString()}>
                    {formatDateTime(movement.at)}
                  </time>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  )
}

function Kpi({
  label,
  value,
  hint,
  tone,
}: {
  label: string
  value: string
  hint: string
  tone?: 'warn' | 'good'
}) {
  return (
    <div className={`kpi${tone ? ` kpi--${tone}` : ''}`}>
      <p className="kpi__label">{label}</p>
      <p className="kpi__value">{value}</p>
      <p className="kpi__hint">{hint}</p>
    </div>
  )
}

function StatusBadge({ status }: { status: StockStatus }) {
  return <span className={`badge badge--${status}`}>{statusLabel(status)}</span>
}

function NumberCell({
  value,
  step,
  decimals = false,
  onCommit,
  label,
}: {
  value: number
  step: number
  decimals?: boolean
  onCommit: (value: number) => void
  label: string
}) {
  const [draft, setDraft] = useState(decimals ? value.toFixed(2) : String(value))

  useEffect(() => {
    setDraft(decimals ? value.toFixed(2) : String(value))
  }, [value, decimals])

  function commit() {
    const parsed = Number.parseFloat(draft)
    if (!Number.isFinite(parsed)) {
      setDraft(decimals ? value.toFixed(2) : String(value))
      return
    }
    const next = Math.max(0, decimals ? Math.round(parsed * 100) / 100 : Math.round(parsed))
    setDraft(decimals ? next.toFixed(2) : String(next))
    if (next !== value) onCommit(next)
  }

  return (
    <div className="stepper stepper--cell">
      <button type="button" onClick={() => onCommit(Math.max(0, Math.round((value - step) * 100) / 100))} aria-label={`Decrease ${label}`}>
        −
      </button>
      <input
        type="number"
        step={step}
        min={0}
        value={draft}
        aria-label={label}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === 'Enter') event.currentTarget.blur()
        }}
      />
      <button type="button" onClick={() => onCommit(Math.round((value + step) * 100) / 100)} aria-label={`Increase ${label}`}>
        +
      </button>
    </div>
  )
}

function StockEditor({
  product,
  onSet,
  onAdjust,
  notify,
}: {
  product: Product
  onSet: (value: number) => void
  onAdjust: (delta: number) => void
  notify: (message: string, tone?: ToastTone) => void
}) {
  const [draft, setDraft] = useState(String(product.stock))

  useEffect(() => {
    setDraft(String(product.stock))
  }, [product.stock])

  function commit() {
    const parsed = Number.parseInt(draft, 10)
    if (!Number.isFinite(parsed)) {
      setDraft(String(product.stock))
      return
    }
    const next = Math.max(0, parsed)
    setDraft(String(next))
    if (next !== product.stock) {
      onSet(next)
      notify(`${product.name}: stock set to ${next} ${unitShort(product.unit)}`, 'info')
    }
  }

  return (
    <div className="stock-editor">
      <div className="stepper stepper--cell">
        <button
          type="button"
          onClick={() => {
            onAdjust(-10)
            notify(`${product.name}: 10 ${unitShort(product.unit)} written off`, 'warn')
          }}
          aria-label={`Reduce ${product.name} stock by 10`}
        >
          −10
        </button>
        <button type="button" onClick={() => onAdjust(-1)} aria-label={`Reduce ${product.name} stock by 1`}>
          −
        </button>
        <input
          type="number"
          min={0}
          value={draft}
          aria-label={`Stock on hand for ${product.name}`}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={commit}
          onKeyDown={(event) => {
            if (event.key === 'Enter') event.currentTarget.blur()
          }}
        />
        <button type="button" onClick={() => onAdjust(1)} aria-label={`Add 1 ${unitShort(product.unit)} to ${product.name}`}>
          +
        </button>
        <button
          type="button"
          onClick={() => {
            onAdjust(10)
            notify(`${product.name}: 10-unit receipt booked in`, 'success')
          }}
          aria-label={`Add 10 ${unitShort(product.unit)} to ${product.name}`}
        >
          +10
        </button>
      </div>
      <span className="stock-editor__unit">{unitShort(product.unit)}</span>
    </div>
  )
}
