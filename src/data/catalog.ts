import type { Movement, Product } from '../types'

/**
 * Seed catalog for the storefront. Stock levels are the mill's opening counts;
 * they are the source of truth until an inventory adjustment or sale is recorded.
 */
export const SEED_PRODUCTS: Product[] = [
  {
    id: 'p-flanders-linen',
    sku: 'MW-APP-1010',
    name: 'Flanders Washed Linen',
    category: 'Apparel',
    description:
      'European flax, stonewashed for a lived-in hand. Softens further with every wash and dyes beautifully.',
    composition: '100% Belgian flax linen',
    widthCm: 280,
    price: 42.5,
    unit: 'metre',
    stock: 68,
    lowStockThreshold: 15,
    colors: [
      { name: 'Chalk', hex: '#ece5d8' },
      { name: 'Sage', hex: '#9aa88c' },
      { name: 'Terracotta', hex: '#c0704e' },
      { name: 'Deep Indigo', hex: '#3a4763' },
    ],
    tags: ['OEKO-TEX certified', 'Garment washed'],
  },
  {
    id: 'p-cotton-canvas',
    sku: 'MW-UPH-2010',
    name: 'Heavyweight Cotton Canvas',
    category: 'Upholstery',
    description:
      'A dense 12 oz plain weave that holds its shape on frames, slipcovers and cushions. Martindale 40,000 rubs.',
    composition: '100% combed cotton',
    widthCm: 150,
    price: 28,
    unit: 'metre',
    stock: 124,
    lowStockThreshold: 25,
    colors: [
      { name: 'Natural', hex: '#ded2bd' },
      { name: 'Charcoal', hex: '#4a4b4d' },
      { name: 'Olive', hex: '#77805e' },
    ],
    tags: ['Contract grade', 'Martindale 40k'],
  },
  {
    id: 'p-boucle-weave',
    sku: 'MW-UPH-2044',
    name: 'Merino Bouclé Weave',
    category: 'Upholstery',
    description:
      'Looped merino yarns with a soft, pebbled surface. Our most requested fabric for lounge chairs and headboards.',
    composition: '62% merino wool, 38% recycled polyester',
    widthCm: 140,
    price: 56,
    unit: 'metre',
    stock: 7,
    lowStockThreshold: 12,
    colors: [
      { name: 'Oatmeal', hex: '#cfc2ac' },
      { name: 'Fog', hex: '#b3b5b2' },
      { name: 'Amber', hex: '#b8813f' },
    ],
    tags: ['Heavy duty', 'Wool blend'],
  },
  {
    id: 'p-chambray-shirting',
    sku: 'MW-APP-1032',
    name: 'Indigo Chambray Shirting',
    category: 'Apparel',
    description: 'Crisp yarn-dyed chambray with a soft blue warp and white weft. Shirting, dresses and light workwear.',
    composition: '100% organic cotton',
    widthCm: 145,
    price: 21,
    unit: 'metre',
    stock: 96,
    lowStockThreshold: 20,
    colors: [
      { name: 'Sky', hex: '#a8bed3' },
      { name: 'Slate', hex: '#6b7d90' },
    ],
    tags: ['GOTS organic'],
  },
  {
    id: 'p-brushed-twill',
    sku: 'MW-APP-1051',
    name: 'Brushed Cotton Twill',
    category: 'Apparel',
    description: 'Peached twill with a warm nap and enough body for trousers, overshirts and unstructured jackets.',
    composition: '97% cotton, 3% elastane',
    widthCm: 152,
    price: 32,
    unit: 'metre',
    stock: 41,
    lowStockThreshold: 18,
    colors: [
      { name: 'Camel', hex: '#c39a68' },
      { name: 'Forest', hex: '#44543f' },
      { name: 'Ink', hex: '#2c3038' },
    ],
    tags: ['Stretch', 'Brushed'],
  },
  {
    id: 'p-voile-sheer',
    sku: 'MW-DRP-3012',
    name: 'Sheer Linen Voile',
    category: 'Drapery',
    description: 'Featherweight voile that diffuses light without blocking it. Sold by the metre for made-to-measure panels.',
    composition: '100% linen',
    widthCm: 300,
    price: 24,
    unit: 'metre',
    stock: 152,
    lowStockThreshold: 30,
    colors: [
      { name: 'Ivory', hex: '#f1e9dc' },
      { name: 'Mist', hex: '#d8dad6' },
    ],
    tags: ['Light filtering'],
  },
  {
    id: 'p-blackout-panel',
    sku: 'MW-DRP-3040',
    name: 'Blackout Lined Drapery Panel',
    category: 'Drapery',
    description: 'Ready-made 132 × 274 cm panel with a bonded blackout lining and a 4 cm rod pocket.',
    composition: 'Face 100% linen, lining 100% polyester',
    widthCm: 132,
    price: 96,
    unit: 'piece',
    stock: 14,
    lowStockThreshold: 6,
    colors: [
      { name: 'Linen', hex: '#e3d8c4' },
      { name: 'Graphite', hex: '#585a5e' },
    ],
    tags: ['Ready-made', 'Blackout'],
  },
  {
    id: 'p-linen-bedding-set',
    sku: 'MW-BED-4008',
    name: 'Stonewashed Linen Bedding Set',
    category: 'Bed Linens',
    description:
      'Duvet cover and two pillowcases in 165 gsm washed linen. Breathable in summer, warming in winter, no ironing needed.',
    composition: '100% European flax linen',
    widthCm: null,
    price: 189,
    unit: 'set',
    stock: 26,
    lowStockThreshold: 8,
    colors: [
      { name: 'Oat', hex: '#d9cbb4' },
      { name: 'Clay', hex: '#bd8570' },
      { name: 'Eucalyptus', hex: '#93a595' },
    ],
    tags: ['Bestseller', 'Stonewashed'],
  },
  {
    id: 'p-percale-sheets',
    sku: 'MW-BED-4021',
    name: 'Percale Sheet Set — 400TC',
    category: 'Bed Linens',
    description: 'Cool, crisp long-staple percale with a matte finish. Fitted sheet, flat sheet and two pillowcases.',
    composition: '100% long-staple cotton',
    widthCm: null,
    price: 148,
    unit: 'set',
    stock: 9,
    lowStockThreshold: 10,
    colors: [
      { name: 'White', hex: '#f4f1ea' },
      { name: 'Pale Grey', hex: '#cfd0cd' },
    ],
    tags: ['400 thread count'],
  },
  {
    id: 'p-wool-throw',
    sku: 'MW-BED-4055',
    name: 'Recycled Wool Throw',
    category: 'Bed Linens',
    description: 'A substantial 130 × 190 cm throw woven in Yorkshire from reclaimed wool with a hand-knotted fringe.',
    composition: '80% recycled wool, 20% polyamide',
    widthCm: null,
    price: 118,
    unit: 'piece',
    stock: 18,
    lowStockThreshold: 6,
    colors: [
      { name: 'Heather Grey', hex: '#a9a7a2' },
      { name: 'Rust', hex: '#a8552f' },
    ],
    tags: ['Recycled fibre'],
  },
  {
    id: 'p-waffle-towel-set',
    sku: 'MW-BTH-5004',
    name: 'Waffle Weave Towel Set',
    category: 'Bath Linens',
    description: 'Four-piece quick-drying waffle set: two bath towels and two hand towels with a hanging loop.',
    composition: '100% long-staple Turkish cotton',
    widthCm: null,
    price: 76,
    unit: 'set',
    stock: 0,
    lowStockThreshold: 10,
    colors: [
      { name: 'Chalk', hex: '#efeade' },
      { name: 'Sea', hex: '#7d99a3' },
    ],
    tags: ['Quick dry'],
  },
  {
    id: 'p-bath-sheet',
    sku: 'MW-BTH-5022',
    name: 'Turkish Cotton Bath Sheet',
    category: 'Bath Linens',
    description: 'Oversized 100 × 150 cm bath sheet, 600 gsm, with a double-stitched hem.',
    composition: '100% Turkish cotton',
    widthCm: null,
    price: 38,
    unit: 'piece',
    stock: 63,
    lowStockThreshold: 15,
    colors: [
      { name: 'Sand', hex: '#ddcdb4' },
      { name: 'Olive', hex: '#7c8060' },
      { name: 'Slate', hex: '#727b82' },
    ],
    tags: ['600 gsm'],
  },
  {
    id: 'p-table-runner',
    sku: 'MW-TBL-6003',
    name: 'Hemstitched Linen Table Runner',
    category: 'Table Linens',
    description: '40 × 180 cm runner with hand-finished hemstitching, pressed and ready for the table.',
    composition: '100% washed linen',
    widthCm: null,
    price: 54,
    unit: 'piece',
    stock: 34,
    lowStockThreshold: 10,
    colors: [
      { name: 'Natural', hex: '#e0d5c0' },
      { name: 'Merlot', hex: '#7c3b45' },
    ],
    tags: ['Hemstitched'],
  },
  {
    id: 'p-napkin-set',
    sku: 'MW-TBL-6018',
    name: 'Napkin Set of Four',
    category: 'Table Linens',
    description: 'Generous 45 cm dinner napkins in a soft-washed weave that hides the odd spill.',
    composition: '55% linen, 45% cotton',
    widthCm: null,
    price: 42,
    unit: 'set',
    stock: 5,
    lowStockThreshold: 12,
    colors: [
      { name: 'Bone', hex: '#eee6d6' },
      { name: 'Sage', hex: '#a3ae94' },
      { name: 'Cinnamon', hex: '#a8632f' },
    ],
    tags: ['Machine washable'],
  },
]

/** A short opening history so the movement log is not empty on first run. */
export function seedMovements(): Movement[] {
  const now = Date.now()
  const boucle = SEED_PRODUCTS.find((p) => p.id === 'p-boucle-weave')
  const napkin = SEED_PRODUCTS.find((p) => p.id === 'p-napkin-set')
  const movements: Movement[] = []
  if (boucle) {
    movements.push({
      id: 'mv-seed-1',
      at: now - 1000 * 60 * 60 * 26,
      productId: boucle.id,
      sku: boucle.sku,
      name: boucle.name,
      delta: -9,
      stockAfter: boucle.stock,
      reason: 'sale',
      note: 'Wholesale order #4821',
    })
  }
  if (napkin) {
    movements.push({
      id: 'mv-seed-2',
      at: now - 1000 * 60 * 60 * 5,
      productId: napkin.id,
      sku: napkin.sku,
      name: napkin.name,
      delta: -3,
      stockAfter: napkin.stock,
      reason: 'adjustment',
      note: 'Stock count correction — dye lot damage',
    })
  }
  return movements
}

/** Fresh copies of the seed data, so no mutation leaks between resets. */
export function cloneSeedProducts(): Product[] {
  return SEED_PRODUCTS.map((product) => ({
    ...product,
    colors: product.colors.map((color) => ({ ...color })),
    tags: [...product.tags],
  }))
}
