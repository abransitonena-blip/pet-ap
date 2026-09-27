export default function SiteHeader({ active }) {
  return (
    <header className="site-header">
      <a href="#/" className="brand">
        <span className="brand-mark">L</span> LetreroLab
      </a>
      <nav>
        <a href="#/" className={active === 'editor' ? 'active' : ''}>Diseñar</a>
        <a href="#/seguimiento" className={active === 'track' ? 'active' : ''}>Mi pedido</a>
        <a href="#/admin">Admin</a>
      </nav>
    </header>
  )
}
