import { useCallback, useMemo, useRef, useState } from 'react'
import { CartDrawer } from './components/CartDrawer'
import { Header, type View } from './components/Header'
import { Inventory } from './components/Inventory'
import { Shop } from './components/Shop'
import { ToastStack, type Toast, type ToastTone } from './components/Toasts'
import { cartTotals, inventorySummary } from './store/reducer'
import { useStore } from './store/StoreProvider'

export default function App() {
  const { state } = useStore()
  const [view, setView] = useState<View>('shop')
  const [cartOpen, setCartOpen] = useState(false)
  const [toasts, setToasts] = useState<Toast[]>([])
  const toastId = useRef(0)

  const totals = useMemo(() => cartTotals(state), [state])
  const summary = useMemo(() => inventorySummary(state.products), [state.products])
  const alerts = summary.lowCount + summary.outCount

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  const notify = useCallback(
    (message: string, tone: ToastTone = 'success') => {
      toastId.current += 1
      const id = toastId.current
      setToasts((current) => [...current.slice(-3), { id, message, tone }])
      window.setTimeout(() => dismiss(id), 3600)
    },
    [dismiss],
  )

  return (
    <div className="app">
      <a className="skip-link" href="#main">
        Skip to content
      </a>

      <Header
        view={view}
        onViewChange={setView}
        cartCount={totals.count}
        onOpenCart={() => setCartOpen(true)}
        alerts={alerts}
      />

      <main id="main">{view === 'shop' ? <Shop notify={notify} /> : <Inventory notify={notify} />}</main>

      <footer className="site-footer">
        <div className="shell site-footer__inner">
          <div>
            <p className="brand__text">
              <strong>Marlow &amp; Weaver</strong>
              <small>Mill-direct fabrics, cut by hand since 1948</small>
            </p>
            <p className="site-footer__note">
              Huddersfield Mills, Unit 4 · Yorkshire, UK · hello@marlowandweaver.example
            </p>
          </div>
          <div className="site-footer__cols">
            <div>
              <h3>Orders</h3>
              <p>Cut lengths ship in 2–3 working days.</p>
              <p>Swatches free — up to six per order.</p>
            </div>
            <div>
              <h3>Demo build</h3>
              <p>Cart and inventory persist in this browser.</p>
              <p>Checkout is simulated; no payment is taken.</p>
            </div>
          </div>
        </div>
      </footer>

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} notify={notify} />
      <ToastStack toasts={toasts} onDismiss={dismiss} />
    </div>
  )
}
