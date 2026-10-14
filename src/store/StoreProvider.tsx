import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type Dispatch,
  type ReactNode,
} from 'react'
import type { Product, StoreState } from '../types'
import { initialState, reducer, type Action } from './reducer'

const STORAGE_KEY = 'marlow-weaver.catalogue.v1'
/** Bump when the shape of persisted state or the seed catalog changes. */
const DATA_VERSION = 1

interface StoreValue {
  state: StoreState
  dispatch: Dispatch<Action>
}

const StoreContext = createContext<StoreValue | null>(null)

interface Persisted extends Partial<StoreState> {
  version?: number
}

function isProduct(value: unknown): value is Product {
  if (!value || typeof value !== 'object') return false
  const product = value as Partial<Product>
  return (
    typeof product.id === 'string' &&
    typeof product.sku === 'string' &&
    typeof product.name === 'string' &&
    typeof product.price === 'number' &&
    typeof product.stock === 'number' &&
    Array.isArray(product.colors)
  )
}

function loadState(): StoreState {
  if (typeof window === 'undefined') return initialState()
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return initialState()
    const parsed = JSON.parse(raw) as Persisted
    if (parsed.version !== DATA_VERSION) return initialState()
    if (!Array.isArray(parsed.products) || !parsed.products.every(isProduct)) return initialState()
    if (parsed.products.length === 0) return initialState()
    return {
      products: parsed.products,
      cart: Array.isArray(parsed.cart) ? parsed.cart : [],
      movements: Array.isArray(parsed.movements) ? parsed.movements : [],
    }
  } catch {
    return initialState()
  }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadState)

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: DATA_VERSION, ...state }))
    } catch {
      // Storage can be unavailable (private mode, quota). The app still works in memory.
    }
  }, [state])

  const value = useMemo(() => ({ state, dispatch }), [state])
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore(): StoreValue {
  const value = useContext(StoreContext)
  if (!value) throw new Error('useStore must be used inside <StoreProvider>')
  return value
}
