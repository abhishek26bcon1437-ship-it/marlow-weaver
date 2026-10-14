import { describe, expect, it } from 'vitest'
import { SEED_PRODUCTS } from '../data/catalog'
import type { Product, StoreState } from '../types'
import {
  FREE_SHIPPING_THRESHOLD,
  SHIPPING_FLAT_RATE,
  availableToAdd,
  cartIssues,
  cartTotals,
  findProduct,
  initialState,
  inventorySummary,
  lineKey,
  qtyInCartForProduct,
  reducer,
  stockStatus,
  type Action,
} from './reducer'

function withStock(stock: number, id = SEED_PRODUCTS[0].id): StoreState {
  const base = initialState()
  return {
    ...base,
    products: base.products.map((product) => (product.id === id ? { ...product, stock } : product)),
  }
}

function apply(state: StoreState, ...actions: Action[]): StoreState {
  return actions.reduce((current, action) => reducer(current, action), state)
}

const linen = SEED_PRODUCTS[0]
const colour = linen.colors[0].name

describe('catalogue seed data', () => {
  it('has unique ids and SKUs with sane stock levels', () => {
    const ids = new Set(SEED_PRODUCTS.map((product) => product.id))
    const skus = new Set(SEED_PRODUCTS.map((product) => product.sku))
    expect(ids.size).toBe(SEED_PRODUCTS.length)
    expect(skus.size).toBe(SEED_PRODUCTS.length)
    for (const product of SEED_PRODUCTS) {
      expect(product.stock).toBeGreaterThanOrEqual(0)
      expect(product.lowStockThreshold).toBeGreaterThan(0)
      expect(product.price).toBeGreaterThan(0)
      expect(product.colors.length).toBeGreaterThan(0)
    }
  })

  it('covers fabrics and every home-linen category', () => {
    const categories = new Set(SEED_PRODUCTS.map((product) => product.category))
    expect(categories).toContain('Upholstery')
    expect(categories).toContain('Apparel')
    expect(categories).toContain('Bed Linens')
    expect(categories).toContain('Bath Linens')
    expect(categories).toContain('Table Linens')
    expect(categories).toContain('Drapery')
  })

  it('includes a sold-out line so the empty state is reachable', () => {
    expect(SEED_PRODUCTS.some((product) => product.stock === 0)).toBe(true)
  })
})

describe('cart', () => {
  it('adds a line and merges repeated adds of the same colourway', () => {
    const state = apply(initialState(), { type: 'ADD_TO_CART', productId: linen.id, color: colour, qty: 2 }, {
      type: 'ADD_TO_CART',
      productId: linen.id,
      color: colour,
      qty: 3,
    })
    expect(state.cart).toHaveLength(1)
    expect(state.cart[0]).toMatchObject({ key: lineKey(linen.id, colour), qty: 5 })
  })

  it('keeps separate lines per colourway but a shared stock ceiling', () => {
    const state = withStock(4)
    const result = apply(
      state,
      { type: 'ADD_TO_CART', productId: linen.id, color: 'Chalk', qty: 3 },
      { type: 'ADD_TO_CART', productId: linen.id, color: 'Sage', qty: 3 },
    )
    expect(result.cart).toHaveLength(2)
    expect(qtyInCartForProduct(result, linen.id)).toBe(4)
    expect(availableToAdd(result, linen.id)).toBe(0)
  })

  it('refuses to add anything for a sold-out product', () => {
    const state = withStock(0)
    const result = reducer(state, { type: 'ADD_TO_CART', productId: linen.id, color: colour, qty: 1 })
    expect(result.cart).toHaveLength(0)
    expect(result).toBe(state)
  })

  it('clamps quantity updates to stock and drops the line at zero', () => {
    const state = apply(initialState(), { type: 'ADD_TO_CART', productId: linen.id, color: colour, qty: 2 })
    const key = lineKey(linen.id, colour)
    const raised = reducer(state, { type: 'SET_LINE_QTY', key, qty: 9999 })
    expect(raised.cart[0].qty).toBe(linen.stock)
    expect(reducer(raised, { type: 'SET_LINE_QTY', key, qty: 0 }).cart).toHaveLength(0)
  })
})

describe('checkout', () => {
  it('deducts stock, clears the cart, and logs a sale', () => {
    const state = apply(initialState(), {
      type: 'ADD_TO_CART',
      productId: linen.id,
      color: colour,
      qty: 6,
    })
    const before = findProduct(state, linen.id) as Product
    const after = reducer(state, { type: 'CHECKOUT', orderRef: 'MW-TEST01' })

    const sold = findProduct(after, linen.id) as Product
    expect(sold.stock).toBe(before.stock - 6)
    expect(after.cart).toHaveLength(0)
    expect(after.movements[0]).toMatchObject({
      productId: linen.id,
      delta: -6,
      stockAfter: before.stock - 6,
      reason: 'sale',
    })
    expect(after.movements[0].note).toContain('MW-TEST01')
  })

  it('never writes a negative stock count', () => {
    const state = withStock(3)
    const stocked = reducer(state, { type: 'ADD_TO_CART', productId: linen.id, color: colour, qty: 3 })
    // Simulate stock collapsing under the cart (e.g. another till sold the roll).
    const shrunk: StoreState = { ...stocked, products: stocked.products.map((p) => (p.id === linen.id ? { ...p, stock: 1 } : p)) }
    expect(cartIssues(shrunk)).toHaveLength(1)

    const blocked = reducer(shrunk, { type: 'CHECKOUT', orderRef: 'MW-TEST02' })
    expect(findProduct(blocked, linen.id)?.stock).toBe(1)
    expect(blocked.cart).toHaveLength(1)
    expect(blocked.movements).toHaveLength(shrunk.movements.length)
  })
})

describe('inventory adjustments', () => {
  it('records a restock movement when stock is set higher', () => {
    const state = withStock(20)
    const result = reducer(state, { type: 'SET_STOCK', productId: linen.id, stock: 55, note: 'Delivery' })
    expect(findProduct(result, linen.id)?.stock).toBe(55)
    expect(result.movements[0]).toMatchObject({ delta: 35, stockAfter: 55, reason: 'restock', note: 'Delivery' })
  })

  it('records an adjustment and blocks negative counts', () => {
    const state = withStock(10)
    const down = reducer(state, { type: 'ADJUST_STOCK', productId: linen.id, delta: -4 })
    expect(findProduct(down, linen.id)?.stock).toBe(6)
    expect(down.movements[0]).toMatchObject({ delta: -4, reason: 'adjustment' })

    const floored = reducer(down, { type: 'SET_STOCK', productId: linen.id, stock: -30 })
    expect(findProduct(floored, linen.id)?.stock).toBe(0)
  })

  it('trims cart quantities when stock falls below what is in the cart', () => {
    const state = withStock(12)
    const withCart = reducer(state, { type: 'ADD_TO_CART', productId: linen.id, color: colour, qty: 12 })
    const afterCount = reducer(withCart, { type: 'SET_STOCK', productId: linen.id, stock: 5 })
    expect(afterCount.cart[0].qty).toBe(5)
    expect(qtyInCartForProduct(afterCount, linen.id)).toBe(5)
  })

  it('restocks every line at or below its threshold exactly once', () => {
    const state = initialState()
    const below = state.products.filter((product) => product.stock <= product.lowStockThreshold)
    expect(below.length).toBeGreaterThan(0)

    const restocked = reducer(state, { type: 'RESTOCK_LOW' })
    for (const product of below) {
      const next = findProduct(restocked, product.id) as Product
      expect(next.stock).toBeGreaterThan(next.lowStockThreshold)
      expect(stockStatus(next)).toBe('in')
    }
    expect(reducer(restocked, { type: 'RESTOCK_LOW' }).movements.length).toBe(restocked.movements.length)
  })

  it('restores opening counts on reset and logs the correction', () => {
    const sold = apply(initialState(), { type: 'ADD_TO_CART', productId: linen.id, color: colour, qty: 4 }, {
      type: 'CHECKOUT',
      orderRef: 'MW-TEST03',
    })
    const reset = reducer(sold, { type: 'RESET_INVENTORY' })
    expect(findProduct(reset, linen.id)?.stock).toBe(linen.stock)
    expect(reset.movements[0]).toMatchObject({ delta: 4, reason: 'reset' })
  })

  it('updates price and threshold, ignoring blanks and negatives', () => {
    const state = initialState()
    const updated = reducer(state, {
      type: 'UPDATE_PRODUCT',
      productId: linen.id,
      patch: { price: 39.95, lowStockThreshold: 22, name: '   ' },
    })
    const product = findProduct(updated, linen.id) as Product
    expect(product.price).toBe(39.95)
    expect(product.lowStockThreshold).toBe(22)
    expect(product.name).toBe(linen.name)

    const clamped = reducer(updated, { type: 'UPDATE_PRODUCT', productId: linen.id, patch: { price: -5 } })
    expect(findProduct(clamped, linen.id)?.price).toBe(0)
  })
})

describe('totals and summaries', () => {
  it('charges flat delivery below the free-shipping threshold', () => {
    const state = initialState()
    const cheap = state.products.find((product) => product.price < 30) as Product
    const withSmall = reducer(state, { type: 'ADD_TO_CART', productId: cheap.id, color: cheap.colors[0].name, qty: 1 })
    const totals = cartTotals(withSmall)
    expect(totals.shipping).toBe(SHIPPING_FLAT_RATE)
    expect(totals.total).toBeCloseTo(cheap.price + SHIPPING_FLAT_RATE, 2)
    expect(totals.freeShippingRemaining).toBeCloseTo(FREE_SHIPPING_THRESHOLD - cheap.price, 2)
  })

  it('waives delivery over the threshold and counts units', () => {
    const state = initialState()
    const pricey = state.products.find((product) => product.price > FREE_SHIPPING_THRESHOLD) as Product
    const withBig = reducer(state, { type: 'ADD_TO_CART', productId: pricey.id, color: pricey.colors[0].name, qty: 1 })
    const totals = cartTotals(withBig)
    expect(totals.shipping).toBe(0)
    expect(totals.count).toBe(1)
    expect(totals.freeShippingRemaining).toBe(0)
  })

  it('summarises inventory value, low lines, and sold-out lines', () => {
    const summary = inventorySummary(initialState().products)
    const expectedUnits = SEED_PRODUCTS.reduce((sum, product) => sum + product.stock, 0)
    const expectedValue = SEED_PRODUCTS.reduce((sum, product) => sum + product.stock * product.price, 0)
    expect(summary.skus).toBe(SEED_PRODUCTS.length)
    expect(summary.units).toBe(expectedUnits)
    expect(summary.value).toBeCloseTo(expectedValue, 5)
    expect(summary.outCount).toBe(SEED_PRODUCTS.filter((product) => product.stock === 0).length)
    expect(summary.categories).toBe(new Set(SEED_PRODUCTS.map((product) => product.category)).size)
  })
})

describe('persistence guard', () => {
  it('hydrates a stored state and ignores unknown actions', () => {
    const stored = withStock(7)
    const hydrated = reducer(initialState(), { type: 'HYDRATE', state: stored })
    expect(findProduct(hydrated, linen.id)?.stock).toBe(7)
    // @ts-expect-error unknown action types must be ignored, not crash
    expect(reducer(hydrated, { type: 'NOPE' })).toBe(hydrated)
  })
})
