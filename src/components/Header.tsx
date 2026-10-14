export type View = 'shop' | 'inventory'

interface HeaderProps {
  view: View
  onViewChange: (view: View) => void
  cartCount: number
  onOpenCart: () => void
  alerts: number
}

export function Header({ view, onViewChange, cartCount, onOpenCart, alerts }: HeaderProps) {
  return (
    <header className="site-header">
      <div className="shell site-header__inner">
        <a className="brand" href="#shop" onClick={() => onViewChange('shop')}>
          <span className="brand__mark" aria-hidden="true" />
          <span className="brand__text">
            <strong>Marlow &amp; Weaver</strong>
            <small>Mill-direct fabrics &amp; home linens</small>
          </span>
        </a>

        <nav className="site-nav" aria-label="Primary">
          <button
            type="button"
            className={`nav-link${view === 'shop' ? ' is-active' : ''}`}
            aria-current={view === 'shop' ? 'page' : undefined}
            onClick={() => onViewChange('shop')}
          >
            Shop
          </button>
          <button
            type="button"
            className={`nav-link${view === 'inventory' ? ' is-active' : ''}`}
            aria-current={view === 'inventory' ? 'page' : undefined}
            onClick={() => onViewChange('inventory')}
          >
            Inventory
            {alerts > 0 && <span className="nav-link__pill">{alerts}</span>}
          </button>
        </nav>

        <button type="button" className="cart-button" onClick={onOpenCart} aria-label={`Open cart, ${cartCount} items`}>
          <span aria-hidden="true">🛒</span>
          <span className="cart-button__label">Cart</span>
          <span className="cart-button__count" aria-hidden="true">
            {cartCount}
          </span>
        </button>
      </div>
    </header>
  )
}
