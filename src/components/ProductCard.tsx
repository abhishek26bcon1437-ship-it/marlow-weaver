import { useState, type CSSProperties } from 'react'
import { unitLabel, unitShort, formatMoney } from '../lib/format'
import { availableToAdd, statusLabel, stockStatus } from '../store/reducer'
import { useStore } from '../store/StoreProvider'
import type { Product } from '../types'
import type { ToastTone } from './Toasts'

interface ProductCardProps {
  product: Product
  notify: (message: string, tone?: ToastTone) => void
}

export function ProductCard({ product, notify }: ProductCardProps) {
  const { state, dispatch } = useStore()
  const [colorIndex, setColorIndex] = useState(0)
  const [qty, setQty] = useState(1)

  const status = stockStatus(product)
  const available = availableToAdd(state, product.id)
  const swatch = product.colors[colorIndex] ?? product.colors[0] ?? { name: 'Natural', hex: '#ddd4c4' }
  const alt = product.colors[(colorIndex + 1) % Math.max(1, product.colors.length)] ?? swatch

  function handleAdd() {
    if (available <= 0) {
      notify(
        product.stock === 0
          ? `${product.name} is sold out`
          : `All ${product.stock} available units of ${product.name} are already in your cart`,
        'warn',
      )
      return
    }
    const add = Math.min(Math.max(1, qty), available)
    dispatch({ type: 'ADD_TO_CART', productId: product.id, color: swatch.name, qty: add })
    notify(`Added ${add} × ${product.name} (${swatch.name}) to your cart`, 'success')
    setQty(1)
  }

  return (
    <article className="card">
      <div
        className="swatch"
        style={{ '--swatch-a': swatch.hex, '--swatch-b': alt.hex } as CSSProperties}
        aria-hidden="true"
      >
        <span className="swatch__weave" />
        <span className={`badge badge--${status} swatch__badge`}>{statusLabel(status)}</span>
        {product.tags[0] && <span className="swatch__tag">{product.tags[0]}</span>}
        <span className="swatch__meta">
          {product.colors.length} colourway{product.colors.length === 1 ? '' : 's'}
        </span>
      </div>

      <div className="card__body">
        <p className="card__eyebrow">
          {product.category} · {product.sku}
        </p>
        <h3 className="card__title">{product.name}</h3>
        <p className="card__desc">{product.description}</p>

        <dl className="spec">
          <div>
            <dt>Composition</dt>
            <dd>{product.composition}</dd>
          </div>
          <div>
            <dt>Width</dt>
            <dd>{product.widthCm ? `${product.widthCm} cm` : 'Cut & sewn'}</dd>
          </div>
        </dl>

        <div className="colorways" role="group" aria-label={`${product.name} colourways`}>
          {product.colors.map((color, index) => (
            <button
              key={color.name}
              type="button"
              className={`chip${index === colorIndex ? ' is-active' : ''}`}
              onClick={() => setColorIndex(index)}
              aria-pressed={index === colorIndex}
              title={color.name}
            >
              <span className="chip__dot" style={{ background: color.hex }} aria-hidden="true" />
              {color.name}
            </button>
          ))}
        </div>

        <div className="card__stock">
          <span className="stock-bar" aria-hidden="true">
            <span
              className={`stock-bar__fill stock-bar__fill--${status}`}
              style={{
                width: `${Math.min(100, Math.round((product.stock / Math.max(product.lowStockThreshold * 3, 1)) * 100))}%`,
              }}
            />
          </span>
          <span className="card__stock-text">
            <strong>{product.stock}</strong> {unitShort(product.unit)} on hand
            {available < product.stock && product.stock > 0 && <> · {available} available</>}
          </span>
        </div>

        <div className="card__footer">
          <p className="price">
            <strong>{formatMoney(product.price)}</strong>
            <span>{unitLabel(product.unit)}</span>
          </p>

          <div className="add-row">
            <div className="stepper stepper--sm">
              <button
                type="button"
                onClick={() => setQty((value) => Math.max(1, value - 1))}
                disabled={qty <= 1}
                aria-label="Decrease quantity"
              >
                −
              </button>
              <input
                type="number"
                min={1}
                max={Math.max(1, available)}
                value={qty}
                onChange={(event) => setQty(Math.max(1, Number(event.target.value) || 1))}
                aria-label={`Quantity of ${product.name}`}
              />
              <button
                type="button"
                onClick={() => setQty((value) => Math.min(Math.max(1, available), value + 1))}
                disabled={qty >= Math.max(1, available)}
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>
            <button type="button" className="button button--primary" onClick={handleAdd} disabled={available <= 0}>
              {product.stock === 0 ? 'Sold out' : available <= 0 ? 'In cart' : 'Add to cart'}
            </button>
          </div>
        </div>
      </div>
    </article>
  )
}
