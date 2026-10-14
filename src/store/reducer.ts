import { cloneSeedProducts, seedMovements } from '../data/catalog'
import type {
  CartLine,
  Movement,
  MovementReason,
  Product,
  StockStatus,
  StoreState,
} from '../types'

export const FREE_SHIPPING_THRESHOLD = 150
export const SHIPPING_FLAT_RATE = 12
/** How many movements we keep in the log. */
export const MOVEMENT_LIMIT = 60

export type Action =
  | { type: 'ADD_TO_CART'; productId: string; color: string; qty?: number }
  | { type: 'SET_LINE_QTY'; key: string; qty: number }
  | { type: 'REMOVE_LINE'; key: string }
  | { type: 'CLEAR_CART' }
  | { type: 'CHECKOUT'; orderRef: string }
  | { type: 'SET_STOCK'; productId: string; stock: number; note?: string }
  | { type: 'ADJUST_STOCK'; productId: string; delta: number; note?: string }
  | { type: 'UPDATE_PRODUCT'; productId: string; patch: Partial<Pick<Product, 'price' | 'lowStockThreshold' | 'name'>> }
  | { type: 'RESTOCK_LOW' }
  | { type: 'RESET_INVENTORY' }
  | { type: 'HYDRATE'; state: StoreState }

export function lineKey(productId: string, color: string): string {
  return `${productId}::${color}`
}

export function initialState(): StoreState {
  return { products: cloneSeedProducts(), cart: [], movements: seedMovements() }
}

export function findProduct(state: StoreState, productId: string): Product | undefined {
  return state.products.find((product) => product.id === productId)
}

export function stockStatus(product: Product): StockStatus {
  if (product.stock <= 0) return 'out'
  if (product.stock <= product.lowStockThreshold) return 'low'
  return 'in'
}

export function statusLabel(status: StockStatus): string {
  if (status === 'out') return 'Sold out'
  if (status === 'low') return 'Low stock'
  return 'In stock'
}

/** Units of a product currently sitting in the cart, across every colorway. */
export function qtyInCartForProduct(state: StoreState, productId: string): number {
  return state.cart
    .filter((line) => line.productId === productId)
    .reduce((sum, line) => sum + line.qty, 0)
}

/** How many more units of a product the cart may take before stock runs out. */
export function availableToAdd(state: StoreState, productId: string): number {
  const product = findProduct(state, productId)
  if (!product) return 0
  return Math.max(0, product.stock - qtyInCartForProduct(state, productId))
}

let movementSeq = 0

function makeMovement(
  product: Product,
  delta: number,
  stockAfter: number,
  reason: MovementReason,
  note?: string,
): Movement {
  movementSeq += 1
  const at = Date.now()
  return {
    id: `mv-${at}-${movementSeq}`,
    at,
    productId: product.id,
    sku: product.sku,
    name: product.name,
    delta,
    stockAfter,
    reason,
    note,
  }
}

function pushMovements(state: StoreState, movements: Movement[]): Movement[] {
  return [...movements, ...state.movements].slice(0, MOVEMENT_LIMIT)
}

/** Keep cart quantities legal after stock drops (a sale, an adjustment, a reset). */
function clampCartForProduct(cart: CartLine[], productId: string, stock: number): CartLine[] {
  let remaining = Math.max(0, stock)
  return cart
    .map((line) => {
      if (line.productId !== productId) return line
      const qty = Math.min(line.qty, remaining)
      remaining -= qty
      return { ...line, qty }
    })
    .filter((line) => line.qty > 0)
}

function setStock(
  state: StoreState,
  productId: string,
  nextStock: number,
  reason: MovementReason,
  note: string | undefined,
): StoreState {
  const product = findProduct(state, productId)
  if (!product) return state

  const stock = Math.max(0, Math.round(nextStock))
  if (stock === product.stock) return state

  const delta = stock - product.stock
  return {
    ...state,
    products: state.products.map((item) => (item.id === product.id ? { ...item, stock } : item)),
    cart: clampCartForProduct(state.cart, product.id, stock),
    movements: pushMovements(state, [makeMovement(product, delta, stock, reason, note)]),
  }
}

export function reducer(state: StoreState, action: Action): StoreState {
  switch (action.type) {
    case 'HYDRATE':
      return action.state

    case 'ADD_TO_CART': {
      const product = findProduct(state, action.productId)
      if (!product) return state

      const requested = Math.max(1, Math.floor(action.qty ?? 1))
      const add = Math.min(requested, availableToAdd(state, product.id))
      if (add <= 0) return state

      const color = action.color || product.colors[0]?.name || 'Default'
      const key = lineKey(product.id, color)
      const existing = state.cart.find((line) => line.key === key)
      const cart = existing
        ? state.cart.map((line) => (line.key === key ? { ...line, qty: line.qty + add } : line))
        : [...state.cart, { key, productId: product.id, color, qty: add }]

      return { ...state, cart }
    }

    case 'SET_LINE_QTY': {
      const line = state.cart.find((item) => item.key === action.key)
      if (!line) return state

      const product = findProduct(state, line.productId)
      const otherLines = state.cart
        .filter((item) => item.productId === line.productId && item.key !== line.key)
        .reduce((sum, item) => sum + item.qty, 0)
      const ceiling = product ? Math.max(0, product.stock - otherLines) : 0
      const qty = Math.min(Math.max(0, Math.floor(action.qty)), ceiling)

      if (qty <= 0) return { ...state, cart: state.cart.filter((item) => item.key !== line.key) }
      if (qty === line.qty) return state
      return {
        ...state,
        cart: state.cart.map((item) => (item.key === line.key ? { ...item, qty } : item)),
      }
    }

    case 'REMOVE_LINE':
      return { ...state, cart: state.cart.filter((line) => line.key !== action.key) }

    case 'CLEAR_CART':
      return state.cart.length === 0 ? state : { ...state, cart: [] }

    case 'CHECKOUT': {
      if (state.cart.length === 0) return state
      // Never write a negative count: refuse the order if any line exceeds stock.
      if (cartIssues(state).length > 0) return state

      const soldByProduct = new Map<string, number>()
      for (const line of state.cart) {
        soldByProduct.set(line.productId, (soldByProduct.get(line.productId) ?? 0) + line.qty)
      }

      const movements: Movement[] = []
      const products = state.products.map((product) => {
        const sold = soldByProduct.get(product.id)
        if (!sold) return product
        const stock = product.stock - sold
        movements.push(
          makeMovement(product, -sold, stock, 'sale', `Order ${action.orderRef} — ${sold} unit${sold === 1 ? '' : 's'}`),
        )
        return { ...product, stock }
      })

      return { ...state, products, cart: [], movements: pushMovements(state, movements) }
    }

    case 'SET_STOCK': {
      const product = findProduct(state, action.productId)
      if (!product) return state
      const target = Math.max(0, Math.round(action.stock))
      return setStock(state, product.id, target, target > product.stock ? 'restock' : 'adjustment', action.note)
    }

    case 'ADJUST_STOCK': {
      const product = findProduct(state, action.productId)
      if (!product) return state
      return setStock(
        state,
        product.id,
        product.stock + action.delta,
        action.delta > 0 ? 'restock' : 'adjustment',
        action.note,
      )
    }

    case 'UPDATE_PRODUCT': {
      const product = findProduct(state, action.productId)
      if (!product) return state
      const patch = action.patch
      const next: Product = {
        ...product,
        name: patch.name?.trim() ? patch.name.trim() : product.name,
        price: patch.price === undefined ? product.price : Math.max(0, patch.price),
        lowStockThreshold:
          patch.lowStockThreshold === undefined
            ? product.lowStockThreshold
            : Math.max(0, Math.round(patch.lowStockThreshold)),
      }
      if (
        next.name === product.name &&
        next.price === product.price &&
        next.lowStockThreshold === product.lowStockThreshold
      ) {
        return state
      }
      return {
        ...state,
        products: state.products.map((item) => (item.id === product.id ? next : item)),
      }
    }

    case 'RESTOCK_LOW': {
      const targets = state.products.filter(
        (product) => product.stock <= product.lowStockThreshold,
      )
      if (targets.length === 0) return state

      const movements: Movement[] = []
      const products = state.products.map((product) => {
        if (product.stock > product.lowStockThreshold) return product
        // Bring the line back to roughly three threshold-heights, so it is not
        // immediately flagged again.
        const target = Math.max(product.lowStockThreshold * 3, product.lowStockThreshold + 5)
        if (target === product.stock) return product
        movements.push(
          makeMovement(product, target - product.stock, target, 'restock', 'Reorder run — low stock'),
        )
        return { ...product, stock: target }
      })

      return { ...state, products, movements: pushMovements(state, movements) }
    }

    case 'RESET_INVENTORY': {
      const seed = cloneSeedProducts()
      const movements: Movement[] = []
      const products = seed.map((product) => {
        const current = findProduct(state, product.id)
        if (current && current.stock !== product.stock) {
          movements.push(
            makeMovement(product, product.stock - current.stock, product.stock, 'reset', 'Demo data restored'),
          )
        }
        return product
      })
      return {
        ...state,
        products,
        cart: state.cart.filter((line) => products.some((product) => product.id === line.productId)),
        movements: pushMovements(state, movements),
      }
    }

    default:
      return state
  }
}

export interface CartIssue {
  key: string
  name: string
  requested: number
  available: number
}

/** Cart lines that can no longer be fulfilled from stock. */
export function cartIssues(state: StoreState): CartIssue[] {
  const issues: CartIssue[] = []
  for (const line of state.cart) {
    const product = findProduct(state, line.productId)
    const available = product?.stock ?? 0
    if (!product || line.qty > available) {
      issues.push({
        key: line.key,
        name: product?.name ?? 'Discontinued item',
        requested: line.qty,
        available,
      })
    }
  }
  return issues
}

export interface CartTotals {
  count: number
  subtotal: number
  shipping: number
  total: number
  freeShippingRemaining: number
}

export function cartTotals(state: StoreState): CartTotals {
  const subtotal = state.cart.reduce((sum, line) => {
    const product = findProduct(state, line.productId)
    return sum + (product ? product.price * line.qty : 0)
  }, 0)
  const count = state.cart.reduce((sum, line) => sum + line.qty, 0)
  const shipping = subtotal === 0 || subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FLAT_RATE
  return {
    count,
    subtotal,
    shipping,
    total: subtotal + shipping,
    freeShippingRemaining: Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal),
  }
}

export interface InventorySummary {
  skus: number
  units: number
  value: number
  lowCount: number
  outCount: number
  categories: number
}

export function inventorySummary(products: Product[]): InventorySummary {
  return products.reduce<InventorySummary>(
    (acc, product) => {
      const status = stockStatus(product)
      acc.skus += 1
      acc.units += product.stock
      acc.value += product.stock * product.price
      if (status === 'low') acc.lowCount += 1
      if (status === 'out') acc.outCount += 1
      return acc
    },
    {
      skus: 0,
      units: 0,
      value: 0,
      lowCount: 0,
      outCount: 0,
      categories: new Set(products.map((product) => product.category)).size,
    },
  )
}
