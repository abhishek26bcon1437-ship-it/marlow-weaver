# Marlow & Weaver — fabrics & home linens storefront

A single-page e-commerce front end for a textile business: product catalogue, shopping cart, and an
inventory management panel. Built with Vite + React + TypeScript, no backend — cart, stock counts and
the movement log persist in `localStorage`.

## Features

**Catalogue (Shop tab)**

- 14 seeded lines across Upholstery, Apparel, Bed Linens, Bath Linens, Table Linens and Drapery.
- Each line carries SKU, composition, width, price and unit (`per metre`, `per set`, `each`), plus
  colourways, tags and live stock.
- Category pills, free-text search across name/SKU/composition/tags, five sort orders, and an
  "in stock only" toggle.
- Per-card colourway picker, quantity stepper capped at available stock, and a stock meter that turns
  amber at the low-stock threshold and red when sold out.

**Cart**

- Slide-out drawer with per-line quantity editing, removal, subtotal, flat $12 delivery (free over $150)
  and a free-delivery nudge.
- Placing an order deducts the sold units from stock, empties the cart and writes a `sale` line to the
  inventory movement log. Checkout is simulated — no payment is taken.
- Stock is enforced everywhere: cart quantities cannot exceed stock on hand, and an order is refused if
  any line exceeds stock (e.g. after an inventory edit while the cart was open).

**Inventory panel (Inventory tab)**

- KPIs: lines, units on hand, retail stock value, and lines needing reorder.
- Low-stock alert with a one-click reorder run that lifts every line at or below its threshold back to
  roughly three thresholds' worth of stock.
- Editable table: price, low-stock threshold and stock on hand (`±1`, `±10`, or type an exact count).
  Negative counts are floored at zero and cart quantities are trimmed to match.
- Movement log recording sales, receipts, write-offs and demo resets, with the resulting stock level.
- CSV export of the currently filtered rows, and a reset back to the opening catalogue counts.

## Scripts

```bash
npm install      # install dependencies
npm run dev      # dev server on http://localhost:3000
npm run build    # typecheck + production build into dist/
npm run preview  # serve the production build
npm test         # vitest: reducer unit tests + DOM tests of the storefront and panel
npm run typecheck
```

## Layout

```
src/
  App.tsx                    view switch, cart drawer, toasts
  components/
    Header.tsx               brand, nav, cart button with count and stock alerts
    Shop.tsx                 hero, filters, sorting, product grid
    ProductCard.tsx          swatch, colourways, stock meter, add to cart
    CartDrawer.tsx           cart lines, totals, checkout
    Inventory.tsx            KPIs, editable stock table, movement log, CSV export
    Toasts.tsx               toast stack
  data/catalog.ts            seed fabric & linen catalogue
  store/reducer.ts           pure cart/inventory/sales reducer + selectors
  store/StoreProvider.tsx    React context with localStorage persistence
  lib/format.ts              money, number, date and unit formatting
```

`store/reducer.ts` holds all business rules and is pure, so it is unit-tested directly; the UI is
tested on top of it with jsdom.

## Data notes

Persisted state is versioned (`marlow-weaver.catalogue.v1`). Bump `DATA_VERSION` in
`store/StoreProvider.tsx` after changing the catalogue shape so stale browsers reseed. Inventory edits
are local to the browser — point `StoreProvider` at an API when a shared backend exists.
