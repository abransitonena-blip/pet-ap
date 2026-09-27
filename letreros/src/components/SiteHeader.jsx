export default function SiteHeader({ active }) {
  return (
    <header className="site-header">
      <a href="#/" className="brand">
        <span className="brand-mark" /> LetreroLab
      </a>
      <nav>
        <a href="#/" className={active === 'led' ? 'active' : ''}>Letrero LED</a>
        <a href="#/impreso" className={active === 'editor' ? 'active' : ''}>Impreso</a>
        <a href="#/seguimiento" className={active === 'track' ? 'active' : ''}>Mi pedido</a>
        <a href="#/admin">Admin</a>
      </nav>
    </header>
  )
}
