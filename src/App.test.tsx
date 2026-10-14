import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'
import { SEED_PRODUCTS } from './data/catalog'
import { formatMoney, formatNumber } from './lib/format'
import { StoreProvider } from './store/StoreProvider'

const STORAGE_KEY = 'marlow-weaver.catalogue.v1'
const linen = SEED_PRODUCTS.find((product) => product.id === 'p-flanders-linen')!
const boucle = SEED_PRODUCTS.find((product) => product.id === 'p-boucle-weave')!
const soldOut = SEED_PRODUCTS.find((product) => product.stock === 0)!

function renderApp() {
  const user = userEvent.setup()
  render(
    <StoreProvider>
      <App />
    </StoreProvider>,
  )
  return user
}

function cardFor(name: string): HTMLElement {
  return screen.getByRole('heading', { name }).closest('article') as HTMLElement
}

function rowFor(name: string): HTMLElement {
  return screen.getByRole('rowheader', { name: new RegExp(name) }).closest('tr') as HTMLElement
}

function stockInputFor(name: string): HTMLInputElement {
  return screen.getByLabelText(`Stock on hand for ${name}`) as HTMLInputElement
}

async function goToInventory(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: /^Inventory/ }))
}

beforeEach(() => {
  window.localStorage.clear()
})

afterEach(() => {
  cleanup()
  window.localStorage.clear()
})

describe('storefront shell', () => {
  it('renders every seed line in the catalogue with hero totals', () => {
    renderApp()

    expect(screen.getByRole('heading', { name: 'The catalogue' })).toBeDefined()
    for (const product of SEED_PRODUCTS) {
      expect(screen.getByRole('heading', { name: product.name })).toBeDefined()
    }

    const units = SEED_PRODUCTS.reduce((sum, product) => sum + product.stock, 0)
    const heroStats = screen.getByRole('heading', { name: /Cloth worth/ }).closest('.hero__inner') as HTMLElement
    expect(within(heroStats).getByText(formatNumber(units))).toBeDefined()
    expect(within(heroStats).getByText(String(SEED_PRODUCTS.length))).toBeDefined()
  })

  it('shows colourway and stock detail on each card', () => {
    renderApp()
    const card = cardFor(linen.name)

    expect(within(card).getByText(new RegExp(linen.sku))).toBeDefined()
    expect(within(card).getByText(/Belgian flax linen/)).toBeDefined()
    expect(within(card).getByText('280 cm')).toBeDefined()
    expect(within(card).getByText(formatMoney(linen.price))).toBeDefined()
    expect(within(card).getAllByRole('button', { name: /Chalk|Sage|Terracotta|Deep Indigo/ })).toHaveLength(
      linen.colors.length,
    )
    expect(within(card).getByText(String(linen.stock))).toBeDefined()
    expect(within(card).getByText(/on hand/)).toBeDefined()
  })

  it('filters by category and by search term', async () => {
    const user = renderApp()

    await user.click(screen.getByRole('button', { name: 'Bed Linens' }))
    expect(screen.getByRole('heading', { name: 'Stonewashed Linen Bedding Set' })).toBeDefined()
    expect(screen.queryByRole('heading', { name: linen.name })).toBeNull()

    await user.click(screen.getByRole('button', { name: /All fabrics & linens/ }))
    await user.type(screen.getByPlaceholderText(/Search linen/), 'bouclé')
    expect(screen.getByRole('heading', { name: boucle.name })).toBeDefined()
    expect(screen.queryByRole('heading', { name: linen.name })).toBeNull()
  })

  it('disables add-to-cart for a sold-out line', () => {
    renderApp()
    const card = cardFor(soldOut.name)
    const button = within(card).getByRole('button', { name: 'Sold out' })
    expect((button as HTMLButtonElement).disabled).toBe(true)
    // The card shows the status twice: as a swatch badge and on the disabled button.
    expect(within(card).getAllByText('Sold out')).toHaveLength(2)
  })
})

describe('cart and checkout', () => {
  it('adds a line, totals it, and deducts stock on checkout', async () => {
    const user = renderApp()

    await user.click(within(cardFor(linen.name)).getByRole('button', { name: 'Add to cart' }))
    expect(screen.getByLabelText('Open cart, 1 items')).toBeDefined()

    await user.click(screen.getByLabelText('Open cart, 1 items'))
    const drawer = screen.getByRole('dialog', { name: 'Shopping cart' })
    expect(within(drawer).getByText('Cart (1)')).toBeDefined()
    const subtotalRow = within(drawer).getByText('Subtotal').parentElement as HTMLElement
    expect(within(subtotalRow).getByText(formatMoney(linen.price))).toBeDefined()
    const totalRow = within(drawer).getByText('Total').parentElement as HTMLElement
    // One metre of linen sits under the free-delivery threshold, so flat delivery applies.
    expect(within(totalRow).getByText(formatMoney(linen.price + 12))).toBeDefined()

    await user.click(within(drawer).getByRole('button', { name: 'Place order' }))

    expect(screen.getByText(/Order MW-/)).toBeDefined()
    expect(screen.getByLabelText('Open cart, 0 items')).toBeDefined()

    await goToInventory(user)
    expect(stockInputFor(linen.name).value).toBe(String(linen.stock - 1))
    expect(screen.getByText(/sale · Order MW-/)).toBeDefined()
  })

  it('caps cart quantity at the stock on hand', async () => {
    const user = renderApp()
    const card = cardFor(boucle.name)

    const qty = within(card).getByLabelText(`Quantity of ${boucle.name}`) as HTMLInputElement
    await user.clear(qty)
    await user.type(qty, '99')
    await user.click(within(card).getByRole('button', { name: 'Add to cart' }))

    await user.click(screen.getByLabelText(`Open cart, ${boucle.stock} items`))
    const drawer = screen.getByRole('dialog', { name: 'Shopping cart' })
    expect((within(drawer).getByLabelText(`Quantity for ${boucle.name}`) as HTMLInputElement).value).toBe(
      String(boucle.stock),
    )
    expect((within(card).getByRole('button', { name: 'In cart' }) as HTMLButtonElement).disabled).toBe(true)
  })

  it('removes a line and empties the cart', async () => {
    const user = renderApp()
    await user.click(within(cardFor(linen.name)).getByRole('button', { name: 'Add to cart' }))
    await user.click(screen.getByLabelText('Open cart, 1 items'))

    const drawer = screen.getByRole('dialog', { name: 'Shopping cart' })
    await user.click(within(drawer).getByRole('button', { name: 'Remove' }))
    expect(screen.getByLabelText('Open cart, 0 items')).toBeDefined()
    expect(within(drawer).getByText('Nothing cut yet')).toBeDefined()
  })

  it('persists cart and inventory state to localStorage', async () => {
    const user = renderApp()
    await user.click(within(cardFor(linen.name)).getByRole('button', { name: 'Add to cart' }))

    const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '{}')
    expect(saved.version).toBe(1)
    expect(saved.cart).toHaveLength(1)
    expect(saved.cart[0]).toMatchObject({ productId: linen.id, qty: 1 })
    expect(saved.products).toHaveLength(SEED_PRODUCTS.length)
  })
})

describe('inventory panel', () => {
  it('edits stock levels and logs the movement', async () => {
    const user = renderApp()
    await goToInventory(user)

    expect(screen.getByRole('heading', { name: 'Inventory management' })).toBeDefined()
    expect(stockInputFor(boucle.name).value).toBe(String(boucle.stock))

    await user.click(screen.getByLabelText(`Add 10 m to ${boucle.name}`))

    expect(stockInputFor(boucle.name).value).toBe(String(boucle.stock + 10))
    expect(screen.getByText(/restock · Stock received/)).toBeDefined()
  })

  it('flags low and sold-out lines and clears them with a reorder run', async () => {
    const user = renderApp()
    await goToInventory(user)

    const lowAtStart = SEED_PRODUCTS.filter((product) => product.stock <= product.lowStockThreshold)
    expect(lowAtStart.length).toBeGreaterThan(0)
    expect(screen.getByText(/are at or below their reorder threshold/)).toBeDefined()

    await user.click(screen.getByRole('button', { name: 'Run reorder' }))

    expect(screen.queryByText(/are at or below their reorder threshold/)).toBeNull()
    for (const product of lowAtStart) {
      expect(Number(stockInputFor(product.name).value)).toBeGreaterThan(product.lowStockThreshold)
    }
  })

  it('updates price and threshold from the table', async () => {
    const user = renderApp()
    await goToInventory(user)

    const price = screen.getByLabelText(`Price for ${linen.name}`) as HTMLInputElement
    await user.clear(price)
    await user.type(price, '51.25{Enter}')
    expect(price.value).toBe('51.25')
    expect(within(rowFor(linen.name)).getByText(formatMoney(51.25 * linen.stock))).toBeDefined()

    const threshold = screen.getByLabelText(`Low stock threshold for ${linen.name}`) as HTMLInputElement
    await user.clear(threshold)
    await user.type(threshold, '30{Enter}')
    expect(threshold.value).toBe('30')
  })

  it('restores the opening counts with reset', async () => {
    const user = renderApp()
    await goToInventory(user)
    // Bouclé opens at 7 m, so a 10 m write-off floors at zero rather than going negative.
    await user.click(screen.getByLabelText(`Reduce ${boucle.name} stock by 10`))
    expect(stockInputFor(boucle.name).value).toBe('0')

    await user.click(screen.getByRole('button', { name: 'Reset demo data' }))
    expect(stockInputFor(boucle.name).value).toBe(String(boucle.stock))
  })

  it('shows stock value per line and the movement log', async () => {
    const user = renderApp()
    await goToInventory(user)

    expect(within(rowFor(linen.name)).getByText(formatMoney(linen.price * linen.stock))).toBeDefined()
    expect(screen.getByRole('heading', { name: 'Movement log' })).toBeDefined()
    expect(screen.getByText(/Wholesale order #4821/)).toBeDefined()
  })
})
