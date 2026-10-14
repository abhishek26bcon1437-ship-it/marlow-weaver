import { useEffect } from 'react'
import { formatMoney, unitLabel } from '../lib/format'
import {
  FREE_SHIPPING_THRESHOLD,
  availableToAdd,
  cartIssues,
  cartTotals,
  findProduct,
} from '../store/reducer'
import { useStore } from '../store/StoreProvider'
import type { ToastTone } from './Toasts'

interface CartDrawerProps {
  open: boolean
  onClose: () => void
  notify: (message: string, tone?: ToastTone) => void
}

function orderRef(): string {
  const stamp = Date.now().toString(36).slice(-4).toUpperCase()
  const random = Math.floor(Math.random() * 46656)
    .toString(36)
    .padStart(3, '0')
    .toUpperCase()
  return `MW-${stamp}${random}`
}

export function CartDrawer({ open, onClose, notify }: CartDrawerProps) {
  const { state, dispatch } = useStore()
  const totals = cartTotals(state)
  const issues = cartIssues(state)

  useEffect(() => {
    if (!open) return
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [open, onClose])

  function handleCheckout() {
    if (state.cart.length === 0) return
    if (issues.length > 0) {
      notify('Some lines exceed the stock on hand — adjust quantities to continue', 'warn')
      return
    }
    const ref = orderRef()
    const units = totals.count
    const amount = totals.total
    dispatch({ type: 'CHECKOUT', orderRef: ref })
    notify(`Order ${ref} confirmed — ${units} unit${units === 1 ? '' : 's'}, ${formatMoney(amount)}`, 'success')
    onClose()
  }

  return (
    <>
      <div className={`scrim${open ? ' is-open' : ''}`} onClick={onClose} aria-hidden="true" />
      <aside className={`cart-drawer${open ? ' is-open' : ''}`} role="dialog" aria-modal="true" aria-label="Shopping cart" aria-hidden={!open}>
        <header className="cart-drawer__head">
          <div>
            <p className="eyebrow">Your order</p>
            <h2>Cart ({totals.count})</h2>
          </div>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Close cart">
            ✕
          </button>
        </header>

        <div className="cart-drawer__body">
          {state.cart.length === 0 ? (
            <div className="empty empty--tight">
              <h3>Nothing cut yet</h3>
              <p>Add fabrics or linens from the catalogue and they will appear here.</p>
              <button type="button" className="button button--primary" onClick={onClose}>
                Continue shopping
              </button>
            </div>
          ) : (
            <ul className="cart-lines">
              {state.cart.map((line) => {
                const product = findProduct(state, line.productId)
                if (!product) return null
                const overStock = line.qty > product.stock
                const ceiling = Math.max(1, availableToAdd(state, product.id) + line.qty)
                return (
                  <li key={line.key} className="cart-line">
                    <span
                      className="cart-line__swatch"
                      style={{
                        background:
                          product.colors.find((color) => color.name === line.color)?.hex ?? '#ddd4c4',
                      }}
                      aria-hidden="true"
                    />
                    <div className="cart-line__info">
                      <p className="cart-line__name">{product.name}</p>
                      <p className="cart-line__meta">
                        {line.color} · {product.sku} · {formatMoney(product.price)} {unitLabel(product.unit)}
                      </p>
                      {overStock && (
                        <p className="cart-line__warn">Only {product.stock} in stock — reduce the quantity</p>
                      )}
                    </div>
                    <div className="cart-line__controls">
                      <div className="stepper stepper--sm">
                        <button
                          type="button"
                          onClick={() => dispatch({ type: 'SET_LINE_QTY', key: line.key, qty: line.qty - 1 })}
                          aria-label={`Decrease ${product.name}`}
                        >
                          −
                        </button>
                        <input
                          type="number"
                          min={1}
                          max={ceiling}
                          value={line.qty}
                          onChange={(event) =>
                            dispatch({
                              type: 'SET_LINE_QTY',
                              key: line.key,
                              qty: Math.max(1, Number(event.target.value) || 1),
                            })
                          }
                          aria-label={`Quantity for ${product.name}`}
                        />
                        <button
                          type="button"
                          onClick={() => dispatch({ type: 'SET_LINE_QTY', key: line.key, qty: line.qty + 1 })}
                          disabled={line.qty >= ceiling}
                          aria-label={`Increase ${product.name}`}
                        >
                          +
                        </button>
                      </div>
                      <p className="cart-line__total">{formatMoney(product.price * line.qty)}</p>
                      <button
                        type="button"
                        className="link-button"
                        onClick={() => dispatch({ type: 'REMOVE_LINE', key: line.key })}
                      >
                        Remove
                      </button>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        {state.cart.length > 0 && (
          <footer className="cart-drawer__foot">
            {totals.freeShippingRemaining > 0 ? (
              <p className="ship-note">
                Add {formatMoney(totals.freeShippingRemaining)} more for free delivery
              </p>
            ) : (
              <p className="ship-note ship-note--good">Free delivery applied (orders over ${FREE_SHIPPING_THRESHOLD})</p>
            )}
            <dl className="totals">
              <div>
                <dt>Subtotal</dt>
                <dd>{formatMoney(totals.subtotal)}</dd>
              </div>
              <div>
                <dt>Delivery</dt>
                <dd>{totals.shipping === 0 ? 'Free' : formatMoney(totals.shipping)}</dd>
              </div>
              <div className="totals__grand">
                <dt>Total</dt>
                <dd>{formatMoney(totals.total)}</dd>
              </div>
            </dl>
            <div className="cart-drawer__actions">
              <button
                type="button"
                className="button button--primary button--block"
                onClick={handleCheckout}
                disabled={issues.length > 0}
              >
                Place order
              </button>
              <button
                type="button"
                className="button button--ghost button--block"
                onClick={() => dispatch({ type: 'CLEAR_CART' })}
              >
                Empty cart
              </button>
            </div>
            <p className="cart-drawer__fine">
              Checkout is simulated in this build — placing the order deducts stock and writes to the inventory log.
            </p>
          </footer>
        )}
      </aside>
    </>
  )
}
