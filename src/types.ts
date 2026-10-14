export type Category =
  | 'Upholstery'
  | 'Apparel'
  | 'Bed Linens'
  | 'Bath Linens'
  | 'Table Linens'
  | 'Drapery'

export type Unit = 'metre' | 'set' | 'piece' | 'pair'

export interface Colorway {
  name: string
  hex: string
}

export interface Product {
  id: string
  sku: string
  name: string
  category: Category
  description: string
  composition: string
  /** Usable width in cm; null for cut-and-sewn goods sold as sets/pieces. */
  widthCm: number | null
  price: number
  unit: Unit
  stock: number
  lowStockThreshold: number
  colors: Colorway[]
  tags: string[]
}

export interface CartLine {
  /** `${productId}::${colorway}` */
  key: string
  productId: string
  color: string
  qty: number
}

export type MovementReason = 'sale' | 'restock' | 'adjustment' | 'reset'

export interface Movement {
  id: string
  at: number
  productId: string
  sku: string
  name: string
  /** Signed change applied to stock. */
  delta: number
  stockAfter: number
  reason: MovementReason
  note?: string
}

export interface StoreState {
  products: Product[]
  cart: CartLine[]
  movements: Movement[]
}

export type StockStatus = 'out' | 'low' | 'in'
