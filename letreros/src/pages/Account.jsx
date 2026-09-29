import { useState } from 'react'
import SiteHeader from '../components/SiteHeader'
import SiteFooter from '../components/SiteFooter'
import GoogleButton from '../components/GoogleButton'
import Icon from '../components/Icon'
import LedPreview from '../components/LedPreview'
import StatusPill from '../components/StatusPill'
import { api } from '../lib/api'
import { useAccount } from '../lib/account'
import { usePublicSettings } from '../lib/settings'
import { normalizeLedDesign } from '../lib/ledSign'
import { money } from '../lib/pricing'
import { PAY_STATES } from '../lib/prices'

const DRAFT_KEY = 'letreros_led_draft'
const fmt = (iso) => new Date(iso).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })

// Cuenta del cliente: entrar (correo o Google), sus pedidos y sus diseños guardados
export default function Account({ resetToken = '' }) {
  const { account, orders, loading, refresh, signIn, signOut } = useAccount()
  const { business, googleClientId } = usePublicSettings()
  return (
    <div className="page">
      <SiteHeader active="account" />
      <main className="account-page">
        {resetToken ? <ResetPassword token={resetToken} onSession={(x) => { signIn(x); window.location.hash = '#/cuenta' }} /> : loading ? <p className="muted">Cargando…</p> : account ? (
          <Dashboard account={account} orders={orders} onRefresh={refresh} onSignOut={signOut} />
        ) : (
          <SignIn onSession={signIn} google={Boolean(googleClientId)} />
        )}
      </main>
      <SiteFooter business={business} />
    </div>
  )
}

function SignIn({ onSession, google }) {
  const [mode, setMode] = useState('entrar')
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))
  const run = async (fn) => {
    setError('')
    setBusy(true)
    try {
      onSession(await fn())
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }
  const submit = (e) => {
    e.preventDefault()
    run(() => (mode === 'entrar' ? api.accountLogin(form.email, form.password) : api.register(form)))
  }
  return (
    <div className="auth-wrap">
      <section className="auth-card">
        <h1>{mode === 'entrar' ? 'Entra a tu cuenta' : 'Crea tu cuenta'}</h1>
        <p className="muted">Guarda tus diseños, sigue tus pedidos y pide más rápido la próxima vez.</p>
        <GoogleButton onCredential={(credential) => run(() => api.googleAccount(credential))} text={mode === 'entrar' ? 'signin_with' : 'signup_with'} />
        {google && <div className="auth-or"><span>o con tu correo</span></div>}
        <form onSubmit={submit} className="auth-form">
          {mode === 'crear' && <label className="field"><span>Nombre o negocio</span><input className="input" autoComplete="name" value={form.name} onChange={set('name')} required /></label>}
          <label className="field"><span>Correo</span><input className="input" type="email" autoComplete="email" value={form.email} onChange={set('email')} required /></label>
          {mode === 'crear' && <label className="field"><span>WhatsApp (opcional)</span><input className="input" type="tel" autoComplete="tel" value={form.phone} onChange={set('phone')} /></label>}
          <label className="field"><span>Contraseña</span><input className="input" type="password" autoComplete={mode === 'entrar' ? 'current-password' : 'new-password'} minLength={mode === 'crear' ? 8 : undefined} value={form.password} onChange={set('password')} required /></label>
          {error && <p className="error">{error}</p>}
          <button className="btn primary block" disabled={busy}>{busy ? 'Un momento…' : mode === 'entrar' ? 'Entrar' : 'Crear cuenta'}</button>
        </form>
        {mode === 'entrar' && <Forgot initialEmail={form.email} />}
        <p className="small center">
          {mode === 'entrar' ? '¿Primera vez? ' : '¿Ya tienes cuenta? '}
          <button className="link-btn" onClick={() => { setMode(mode === 'entrar' ? 'crear' : 'entrar'); setError('') }}>{mode === 'entrar' ? 'Crea tu cuenta' : 'Entra'}</button>
        </p>
      </section>
      <ul className="auth-perks">
        <li><Icon name="bookmark" /> <span><b>Tus diseños guardados</b> para retomarlos cuando quieras</span></li>
        <li><Icon name="truck" /> <span><b>Tus pedidos</b> con su estado, presupuesto y pagos</span></li>
        <li><Icon name="bolt" /> <span><b>Pedir en un clic</b>: tus datos se llenan solos</span></li>
      </ul>
    </div>
  )
}

function Dashboard({ account, orders, onRefresh, onSignOut }) {
  const [phone, setPhone] = useState(account.phone)
  const [msg, setMsg] = useState('')
  const open = (design) => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(normalizeLedDesign(design)))
    } catch {
      /* sin almacenamiento */
    }
    window.location.hash = '#/'
    window.location.reload()
  }
  const savePhone = async () => {
    setMsg('')
    try {
      await api.updateAccount({ phone })
      await onRefresh()
      setMsg('Guardado')
    } catch (e) {
      setMsg(e.message)
    }
  }
  return (
    <div className="account-dash">
      <header className="account-head">
        {account.picture ? <img className="avatar-lg" src={account.picture} alt="" referrerPolicy="no-referrer" /> : <span className="avatar avatar-lg">{account.name.slice(0, 1).toUpperCase()}</span>}
        <div className="grow">
          <h1>Hola, {account.name.split(' ')[0]}</h1>
          <p className="muted small">{account.email}{account.google && ' · con Google'}</p>
        </div>
        <button className="btn ghost sm" onClick={onSignOut}><Icon name="logout" size={16} /> Salir</button>
      </header>

      <section className="card">
        <h2>Mis pedidos</h2>
        {orders.length ? (
          <ul className="account-orders">
            {orders.map((o) => (
              <li key={o.id}>
                <span className="ao-thumb"><LedPreview design={o.design} night relief={false} /></span>
                <span className="grow">
                  <strong>{o.folio}</strong> <StatusPill status={o.status} />
                  <em className="muted small">{fmt(o.createdAt)} · {o.quantity} pza · {PAY_STATES[o.pay.state]}</em>
                </span>
                <span className="ao-total">{money(o.total)}{o.pay.balance > 0 && <em className="small muted">saldo {money(o.pay.balance)}</em>}</span>
                <a className="btn ghost sm" href={o.quoteUrl}>Ver</a>
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted">Aún no tienes pedidos. Los que hagas con tu sesión iniciada aparecen aquí.</p>
        )}
      </section>

      <section className="card">
        <h2>Mis diseños <span className="muted small">{account.designs.length}/30</span></h2>
        {account.designs.length ? (
          <div className="design-grid">
            {account.designs.map((d) => (
              <article key={d.id} className="saved-design">
                <button className="sd-thumb" onClick={() => open(d.design)} title="Abrir en el configurador"><LedPreview design={normalizeLedDesign(d.design)} night relief={false} /></button>
                <div className="row between">
                  <span><strong>{d.name}</strong><em className="muted small">{fmt(d.savedAt)}</em></span>
                  <button className="icon-btn" title="Borrar" onClick={() => confirm('¿Borrar este diseño?') && api.deleteDesign(d.id).then(onRefresh)}><Icon name="trash" size={16} /></button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="muted">En el configurador toca <b>Guardar</b> para tener aquí tus diseños.</p>
        )}
        <a className="btn primary sm" href="#/"><Icon name="plus" size={16} /> Diseñar un letrero</a>
      </section>

      <section className="card">
        <h2>Mis datos</h2>
        <div className="row wrap">
          <label className="field grow"><span>WhatsApp para avisarte de tu pedido</span><input className="input" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} /></label>
          <button className="btn ghost sm" onClick={savePhone} disabled={phone === account.phone}>Guardar</button>
        </div>
        {msg && <p className="small">{msg}</p>}
      </section>
    </div>
  )
}

// ¿Olvidaste tu contraseña? Abre una solicitud; el equipo te manda un enlace de un solo uso
function Forgot({ initialEmail }) {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState(initialEmail)
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)
  if (!open) return <button className="link-btn forgot-link" type="button" onClick={() => { setEmail(initialEmail); setOpen(true) }}>¿Olvidaste tu contraseña?</button>
  return (
    <form className="forgot-box" onSubmit={async (e) => {
      e.preventDefault()
      setBusy(true)
      try {
        setMsg((await api.forgot(email)).message)
      } catch (err) {
        setMsg(err.message)
      } finally {
        setBusy(false)
      }
    }}>
      <label className="field"><span>Tu correo</span><input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></label>
      <button className="btn ghost sm" disabled={busy}>Pedir enlace para restablecer</button>
      {msg && <p className="small" role="status">{msg}</p>}
    </form>
  )
}

function ResetPassword({ token, onSession }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  return (
    <div className="auth-wrap">
      <form className="auth-card" onSubmit={async (e) => {
        e.preventDefault()
        setBusy(true)
        setError('')
        try {
          onSession(await api.resetPassword(token, password))
        } catch (err) {
          setError(err.message)
        } finally {
          setBusy(false)
        }
      }}>
        <h1>Nueva contraseña</h1>
        <p className="muted small">El enlace sirve una sola vez y vence en una hora.</p>
        <label className="field"><span>Contraseña (mínimo 8 caracteres)</span><input className="input" type="password" autoComplete="new-password" minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} required /></label>
        {error && <p className="error">{error}</p>}
        <button className="btn primary block" disabled={busy}>Guardar y entrar</button>
      </form>
    </div>
  )
}
