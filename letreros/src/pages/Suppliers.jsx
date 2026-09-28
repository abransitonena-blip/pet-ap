import { useEffect, useMemo, useState } from 'react'
import { api } from '../lib/api'
import { fileToJpeg } from '../lib/image'
import { refreshPublicSettings } from '../lib/settings'
import { FinishSwatch } from '../components/Finish'
import { FINISH_MATERIAL, CUT_OPTIONS, HARDWARE_KIT, SUPPLIERS, SUPPLIER_CATEGORIES, partCategory, suppliersFor } from '../lib/suppliers'
import { DEFAULT_COSTS, costEstimate, margin } from '../lib/costs'
import { REFERENCE_SIGNS } from '../lib/market'
import { FINISHES, FRAME_LINE, boardMaterialById, defaultLedDesign, faceCount, normalizeLedDesign, planPower } from '../lib/ledSign'
import { computeTotals } from '../lib/prices'
import { money, quote } from '../lib/pricing'
import { INVENTORY_ITEMS, consumption } from '../lib/inventory'

const catName = (id) => SUPPLIER_CATEGORIES.find((c) => c.id === id)?.name || 'Otro'
const EMPTY = { name: '', category: 'led', contact: '', phone: '', url: '', what: '', price: '', note: '' }

const COST_FIELDS = [
  ['ledEach', 'LED 5 mm (c/u)'],
  ['sheets.acrilico', 'Hoja acrílico 3 mm 1.22×2.44'],
  ['sheets.pvc', 'Hoja PVC 6 mm 1.22×2.44'],
  ['sheets.mdf', 'Hoja MDF 6 mm 1.22×2.44'],
  ['wastePct', 'Desperdicio de corte (%)'],
  ['vinylM2', 'Vinil de textura (m²)'],
  ['capacitor', 'Capacitor 400 V'],
  ['bridge', 'Puente rectificador'],
  ['resistor', 'Resistencia'],
  ['boardB', 'Placa B armada'],
  ['boardA', 'Placa A (secuenciador)'],
  ['supply12', 'Eliminador 12 V'],
  ['bracket', 'Ménsula de bandera'],
  ['packaging', 'Empaque'],
  ['laborHour', 'Mano de obra (hora)'],
  ['minutesPer100Led', 'Minutos por cada 100 LED']
]
const getPath = (o, p) => p.split('.').reduce((a, k) => a?.[k], o)
const setPath = (o, p, v) => {
  const [k, kk] = p.split('.')
  return kk ? { ...o, [k]: { ...o[k], [kk]: v } } : { ...o, [k]: v }
}

// Diseño sintético con N LED para estimar margen de los tamaños típicos
function sample(ref) {
  const dots = Array.from({ length: ref.leds }, (_, i) => [10 + (i % 60) * 5, 10 + Math.floor(i / 60) * 5, 0, i])
  const frame = Array.from({ length: ref.frame || 0 }, (_, i) => [5, 5, FRAME_LINE, i % 6])
  return normalizeLedDesign({ ...defaultLedDesign(), widthCm: ref.widthCm, heightCm: ref.heightCm, frame: { on: Boolean(ref.frame) }, lines: [{ text: 'X', color: 'rojo' }], dots: [...dots, ...frame] })
}

export default function Suppliers({ settings, orders, onSaved, canEdit, initialTab = 'directorio' }) {
  const [tab, setTab] = useState(initialTab)
  const [mine, setMine] = useState([])
  const [cat, setCat] = useState('todos')
  const [form, setForm] = useState(EMPTY)
  const [costs, setCosts] = useState(settings?.costs || DEFAULT_COSTS)
  const [msg, setMsg] = useState('')
  useEffect(() => setCosts(settings?.costs || DEFAULT_COSTS), [settings?.costs])
  const load = () => api.suppliers().then(setMine).catch((e) => setMsg(e.message))
  useEffect(() => {
    load()
  }, [])
  const act = async (fn) => {
    setMsg('')
    try {
      await fn()
      await load()
    } catch (e) {
      setMsg(e.message)
    }
  }
  const list = [...mine.map((m) => ({ ...m, mine: true })), ...SUPPLIERS].filter((s) => cat === 'todos' || s.category === cat)

  const rows = useMemo(() => {
    if (!settings) return []
    const refs = REFERENCE_SIGNS.map((r) => {
      const d = sample(r)
      const q = quote({ ...d, quantity: 1 }, settings.prices)
      return { name: r.name, design: d, price: computeTotals(q, {}, settings.business).subtotal }
    })
    const real = (orders || [])
      .filter((o) => o.design.kind === 'led' && o.totals && o.status !== 'cancelado')
      .slice(0, 10)
      .map((o) => ({ name: `${o.folio} · ${o.design.lines.map((l) => l.text).join(' ').slice(0, 24)}`, design: o.design, price: o.totals.subtotal / (o.quote.quantity || 1) }))
    return [...refs, ...real].map((r) => {
      const c = costEstimate(r.design, costs)
      return { ...r, cost: c.total, minutes: c.minutes, ...margin(r.price, c.total) }
    })
  }, [settings, orders, costs])

  const saveCosts = async () => {
    setMsg('')
    try {
      onSaved(await api.saveCosts(costs))
      setMsg('Costos guardados')
    } catch (e) {
      setMsg(e.message)
    }
  }

  return (
    <div className="suppliers">
      <div className="switch small">
        <button className={tab === 'directorio' ? 'active' : ''} onClick={() => setTab('directorio')}>Directorio</button>
        <button className={tab === 'costos' ? 'active' : ''} onClick={() => setTab('costos')}>Costos y margen</button>
        <button className={tab === 'inventario' ? 'active' : ''} onClick={() => setTab('inventario')}>Inventario</button>
        <button className={tab === 'compras' ? 'active' : ''} onClick={() => setTab('compras')}>Lista de compras</button>
        <button className={tab === 'equipo' ? 'active' : ''} onClick={() => setTab('equipo')}>Equipo e inversión</button>
        <button className={tab === 'texturas' ? 'active' : ''} onClick={() => setTab('texturas')}>Texturas reales</button>
      </div>
      {msg && <p className="small">{msg}</p>}

      {tab === 'texturas' ? (
        <RealTextures canEdit={canEdit} />
      ) : tab === 'equipo' ? (
        <Investment orders={orders} costs={costs} />
      ) : tab === 'inventario' ? (
        <Inventory orders={orders} mine={mine} />
      ) : tab === 'compras' ? (
        <ShoppingList orders={orders} />
      ) : tab === 'directorio' ? (
        <>
          <p className="muted small">Proveedores reales encontrados en línea (septiembre 2026). Los precios son orientativos: confirma antes de comprar y agrega los tuyos.</p>
          <div className="chips">
            <button className={cat === 'todos' ? 'active' : ''} onClick={() => setCat('todos')}>Todos</button>
            {SUPPLIER_CATEGORIES.map((c) => (
              <button key={c.id} className={cat === c.id ? 'active' : ''} onClick={() => setCat(c.id)}>{c.name}</button>
            ))}
          </div>
          <div className="supplier-grid">
            {list.map((x) => (
              <article key={x.id || x.name} className={`supplier ${x.mine ? 'mine' : ''}`}>
                <div className="row between">
                  <span className="sup-cat">{catName(x.category)}</span>
                  {x.mine && canEdit && <button className="link-btn danger" onClick={() => confirm(`¿Quitar ${x.name}?`) && act(() => api.deleteSupplier(x.id))}>Quitar</button>}
                </div>
                <strong>{x.name}</strong>
                {x.what && <span>{x.what}</span>}
                {x.price && <span className="sup-price">{x.price}</span>}
                {x.note && <em>{x.note}</em>}
                <div className="row wrap">
                  {x.url && <a className="btn ghost sm" href={x.url} target="_blank" rel="noreferrer">Ver tienda ↗</a>}
                  {x.phone && <a className="btn ghost sm" href={`https://wa.me/${x.phone.replace(/\D/g, '').length === 10 ? '52' : ''}${x.phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer">WhatsApp</a>}
                  {x.contact && <span className="muted small">{x.contact}</span>}
                </div>
              </article>
            ))}
          </div>
          {canEdit && (
            <form className="card lead-form" onSubmit={(e) => { e.preventDefault(); act(async () => { await api.addSupplier(form); setForm(EMPTY) }) }}>
              <h2>Agregar mi proveedor</h2>
              <div className="lead-grid">
                <input className="input" placeholder="Nombre *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                <select className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                  {SUPPLIER_CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <input className="input" placeholder="Qué le compras" value={form.what} onChange={(e) => setForm({ ...form, what: e.target.value })} />
                <input className="input" placeholder="Precio que te da" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
                <input className="input" placeholder="Contacto" value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} />
                <input className="input" placeholder="WhatsApp" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                <input className="input" placeholder="https://tienda…" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} />
                <input className="input" placeholder="Nota" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
              </div>
              <button className="btn primary sm" disabled={!form.name.trim()}>Agregar</button>
            </form>
          )}
        </>
      ) : (
        <>
          <section className="card">
            <h2>Margen por letrero</h2>
            <p className="muted small">Precio sin IVA contra costo de material y mano de obra. Abajo de 35 % el margen es bajo para un producto a la medida.</p>
            <div className="table-wrap">
              <table className="market-table">
                <thead><tr><th>Letrero</th><th>Precio s/IVA</th><th>Costo</th><th>Ganancia</th><th>Margen</th><th>Tiempo</th></tr></thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.name}>
                      <td>{r.name}<div className="muted small">{r.design.widthCm}×{r.design.heightCm} cm · {r.design.dots.length} LED</div></td>
                      <td>{money(r.price)}</td>
                      <td>{money(r.cost)}</td>
                      <td>{money(r.profit)}</td>
                      <td><span className={`margin ${r.pct < 35 ? 'low' : r.pct < 55 ? 'mid' : 'ok'}`}>{r.pct} %</span></td>
                      <td className="muted">{Math.round(r.minutes / 6) / 10} h</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
          <section className="card">
            <div className="row between">
              <h2>Tus costos</h2>
              {canEdit && <button className="btn primary sm" onClick={saveCosts} disabled={JSON.stringify(costs) === JSON.stringify(settings?.costs)}>Guardar</button>}
            </div>
            <div className="price-grid">
              {COST_FIELDS.map(([path, label]) => (
                <label key={path} className="field">
                  <span>{label}</span>
                  <input className="input" type="number" min="0" step="0.01" disabled={!canEdit} value={getPath(costs, path)} onChange={(e) => setCosts((c) => setPath(c, path, Number(e.target.value)))} />
                </label>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  )
}

const waLink = (phone, text) => {
  const d = String(phone || '').replace(/\D/g, '')
  return `https://wa.me/${d.length === 10 ? '52' : ''}${d}?text=${encodeURIComponent(text)}`
}
const fmtQty = (n, unit) => (unit === 'pz' ? Math.ceil(n) : Math.ceil(n * 10) / 10)

// Existencias del taller: se descuentan solas al marcar un pedido como terminado.
// Calcula lo que falta comprar para los pedidos por fabricar y arma el pedido al proveedor.
function Inventory({ orders = [], mine = [] }) {
  const [inv, setInv] = useState(null)
  const [saved, setSaved] = useState(null)
  const [started, setStarted] = useState(true)
  const [msg, setMsg] = useState('')
  const [who, setWho] = useState('')
  useEffect(() => {
    api.inventory().then((r) => {
      setInv(r.items)
      setSaved(r.items)
      setStarted(r.started)
    }).catch((e) => setMsg(e.message))
  }, [])
  const need = useMemo(() => {
    const m = new Map()
    for (const o of orders) {
      if (o.design.kind !== 'led' || !TO_BUILD.includes(o.status)) continue
      for (const [k, n] of consumption(o.design, o.quote.quantity || 1)) m.set(k, (m.get(k) || 0) + n)
    }
    return m
  }, [orders])
  if (!inv) return <p className="muted">{msg || 'Cargando inventario…'}</p>

  const rows = INVENTORY_ITEMS.map((it) => {
    const { qty, min } = inv[it.key]
    const req = need.get(it.key) || 0
    const buy = Math.max(0, req + min - qty)
    return { ...it, qty, min, req, buy, low: qty < min, short: qty < req }
  })
  const toBuy = rows.filter((r) => r.buy > 0 && (r.req > 0 || started))
  const dirty = JSON.stringify(inv) !== JSON.stringify(saved)
  const set = (key, field, v) => setInv((x) => ({ ...x, [key]: { ...x[key], [field]: v === '' ? 0 : Number(v) } }))
  const save = async () => {
    setMsg('')
    try {
      const r = await api.saveInventory(inv)
      setInv(r.items)
      setSaved(r.items)
      setStarted(true)
      setMsg('Inventario guardado')
    } catch (e) {
      setMsg(e.message)
    }
  }
  const withPhone = mine.filter((x) => x.phone)
  const supplier = withPhone.find((x) => x.id === who)
  // Si el proveedor es de una categoría, el pedido solo lleva lo suyo
  const forSupplier = supplier ? toBuy.filter((r) => r.category === supplier.category) : toBuy
  const lines = (supplier && forSupplier.length ? forSupplier : toBuy).map((r) => `• ${fmtQty(r.buy, r.unit)} ${r.unit} — ${r.name}`)
  const text = [`Hola${supplier?.contact ? ` ${supplier.contact}` : ''}, soy de AP letreros. Quiero cotizar / pedir:`, ...lines, '', '¿Me confirmas precio y tiempo de entrega? Gracias.'].join('\n')

  return (
    <>
      {!started && <p className="notice small">Captura cuánto tienes de cada material y guarda. A partir de ahí, cada letrero que marques como <b>Impreso</b> descuenta solo su material (LED por color, placa, capacitores, fuentes, tira del halo, WiFi y caja).</p>}
      <section className="card">
        <div className="row between">
          <h2>Existencias {started && rows.some((r) => r.low) && <span className="impact alto">{rows.filter((r) => r.low).length} bajo el mínimo</span>}</h2>
          <button className="btn primary sm" onClick={save} disabled={!dirty && started}>Guardar</button>
        </div>
        {msg && <p className="small">{msg}</p>}
        <div className="table-wrap">
          <table className="market-table inventory-table">
            <thead><tr><th>Material</th><th>Tengo</th><th>Mínimo</th><th>Pedidos por fabricar</th><th>Comprar</th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.key} className={started && (r.short || r.low) ? 'low-row' : ''}>
                  <td>{r.name}<div className="muted small">{catName(r.category)}</div></td>
                  <td><input className="input sm-num" type="number" step="any" value={r.qty} onChange={(e) => set(r.key, 'qty', e.target.value)} aria-label={`Existencia de ${r.name}`} /> <span className="muted small">{r.unit}</span></td>
                  <td><input className="input sm-num" type="number" min="0" step="any" value={r.min} onChange={(e) => set(r.key, 'min', e.target.value)} aria-label={`Mínimo de ${r.name}`} /></td>
                  <td>{r.req ? `${fmtQty(r.req, r.unit)} ${r.unit}` : '—'}</td>
                  <td>{r.buy > 0 && (r.req > 0 || started) ? <strong className={r.short ? 'warn-text' : ''}>{fmtQty(r.buy, r.unit)} {r.unit}</strong> : <span className="muted">—</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="muted small">Consumo por letrero: LED del diseño + 5 % de repuesto, placa × caras + 15 % de corte (hoja de 1.22×2.44 = 2.98 m²), un capacitor por cadena, puente y resistencia, placas B/A o eliminador, tira y separadores del halo, módulo WiFi y caja.</p>
      </section>

      {toBuy.length > 0 && (
        <section className="card">
          <h2>Pedido al proveedor</h2>
          <p className="muted small">Lo que falta para los pedidos por fabricar y para volver al mínimo. Mándalo en un clic a tu proveedor por WhatsApp o cópialo.</p>
          <div className="row wrap">
            <select className="input" value={who} onChange={(e) => setWho(e.target.value)}>
              <option value="">{withPhone.length ? 'Elige proveedor con WhatsApp…' : 'Agrega proveedores con WhatsApp en Directorio'}</option>
              {withPhone.map((x) => <option key={x.id} value={x.id}>{x.name} · {catName(x.category)}</option>)}
            </select>
            {supplier && <a className="btn primary sm" href={waLink(supplier.phone, text)} target="_blank" rel="noreferrer">Pedir por WhatsApp</a>}
            <button className="btn ghost sm" onClick={() => navigator.clipboard?.writeText(text).then(() => setMsg('Pedido copiado'))}>Copiar pedido</button>
          </div>
          <pre className="order-text">{text}</pre>
          <ul className="buy-list">
            {toBuy.map((r) => <BuyRow key={r.key} item={r.name} qty={`${fmtQty(r.buy, r.unit)} ${r.unit}`} category={r.category} />)}
          </ul>
        </section>
      )}
    </>
  )
}

// Material para los pedidos por fabricar (aprobados, en diseño e imprimiendo)
const TO_BUILD = ['en_diseno', 'aprobado', 'imprimiendo']
function ShoppingList({ orders = [] }) {
  const pending = orders.filter((o) => o.design.kind === 'led' && TO_BUILD.includes(o.status))
  const items = new Map()
  const sheets = {}
  for (const o of pending) {
    const qty = o.quote.quantity || 1
    for (const b of planPower(o.design).bom) items.set(b.item, (items.get(b.item) || 0) + b.qty * qty)
    const m = o.design.material
    sheets[m] = (sheets[m] || 0) + (o.design.widthCm / 100) * (o.design.heightCm / 100) * faceCount(o.design) * qty
  }
  const rows = [...items.entries()].sort((a, b) => b[1] - a[1])
  const text = [
    ...Object.entries(sheets).map(([m, a]) => `${boardMaterialById(m).name}: ${Math.ceil((a * 1.15) / (1.22 * 2.44))} hoja(s) de 1.22×2.44 (${a.toFixed(2)} m² + 15 %)`),
    ...rows.map(([item, n]) => `${n} × ${item}`)
  ].join('\n')
  if (!pending.length) return <p className="muted">No hay pedidos LED aprobados o en producción. La lista se arma sola con esos pedidos.</p>
  return (
    <section className="card">
      <div className="row between">
        <h2>Para {pending.length} pedido{pending.length > 1 ? 's' : ''} por fabricar</h2>
        <button className="btn ghost sm" onClick={() => navigator.clipboard?.writeText(text)}>Copiar lista</button>
      </div>
      <ul className="buy-list">
        {Object.entries(sheets).map(([m, a]) => (
          <BuyRow key={m} item={`${boardMaterialById(m).name} · ${a.toFixed(2)} m² + 15 % de corte`} qty={`${Math.ceil((a * 1.15) / (1.22 * 2.44))} hoja(s)`} category={m === 'acrilico' ? 'acrilico' : m} />
        ))}
        {rows.map(([item, n]) => <BuyRow key={item} item={item} qty={n} category={partCategory(item)} />)}
        {HARDWARE_KIT.map((k) => <BuyRow key={k.item} item={k.item} qty={k.qty} category={k.category} />)}
      </ul>
      <p className="muted small">Pedidos: {pending.map((o) => o.folio).join(', ')}</p>
    </section>
  )
}

// ¿Comprar cortadora o mandar a cortar? Tiempo por letrero, costo y meses para recuperar la inversión
function Investment({ orders = [], costs }) {
  const monthAgo = new Date(Date.now() - 30 * 86400000).toISOString()
  const lastMonth = orders.filter((o) => o.design.kind === 'led' && o.createdAt >= monthAgo && o.status !== 'cancelado').length
  const [perMonth, setPerMonth] = useState(Math.max(8, lastMonth))
  const [refIdx, setRefIdx] = useState(1)
  const [clear, setClear] = useState(true)
  const ref = REFERENCE_SIGNS[refIdx]
  const W = ref.widthCm * 10
  const H = ref.heightCm * 10
  const leds = ref.leds + (ref.frame || 0)
  const labor = (costs?.laborHour ?? DEFAULT_COSTS.laborHour) / 60
  const rows = CUT_OPTIONS.map((o) => {
    const minutes = (2 * (W + H)) / o.speed + (leds * o.holeSec) / 60 + 3
    const fits = (ref.widthCm <= o.areaCm[0] && ref.heightCm <= o.areaCm[1]) || (ref.widthCm <= o.areaCm[1] && ref.heightCm <= o.areaCm[0])
    const perSign = o.perMinute ? minutes * o.perMinute : minutes * labor
    return { ...o, minutes, fits, perSign }
  })
  const maquila = rows.find((r) => r.id === 'maquila')
  const withPayback = rows.map((r) => {
    const saving = (maquila.perSign - r.perSign) * perMonth
    return { ...r, saving, payback: r.price && saving > 0 ? r.price / saving : null }
  })
  return (
    <>
      <section className="card">
        <h2>¿Comprar cortadora o mandar a cortar?</h2>
        <p className="muted small">Tiempo de corte de la placa y los barrenos de los LED, costo por letrero y meses para recuperar la inversión frente a pagar corte por minuto. Velocidades típicas en acrílico de 3 mm; precios de referencia.</p>
        <div className="invest-inputs">
          <label className="field"><span>Letreros al mes</span><input className="input" type="number" min="1" max="500" value={perMonth} onChange={(e) => setPerMonth(Math.max(1, +e.target.value || 1))} /></label>
          <label className="field">
            <span>Letrero típico</span>
            <select className="input" value={refIdx} onChange={(e) => setRefIdx(+e.target.value)}>
              {REFERENCE_SIGNS.map((r, i) => <option key={r.name} value={i}>{r.name} · {r.widthCm}×{r.heightCm} cm</option>)}
            </select>
          </label>
          <label className="check-row"><input type="checkbox" checked={clear} onChange={(e) => setClear(e.target.checked)} /><span>Uso acrílico transparente o blanco</span></label>
        </div>
        <div className="table-wrap">
          <table className="market-table">
            <thead><tr><th>Opción</th><th>Inversión</th><th>Tiempo / letrero</th><th>Costo / letrero</th><th>Ahorro / mes</th><th>Se paga en</th></tr></thead>
            <tbody>
              {withPayback.map((r) => {
                const blocked = clear && !r.clear
                return (
                  <tr key={r.id} className={blocked ? 'blocked' : ''}>
                    <td>
                      <strong>{r.name}</strong>
                      <div className="muted small">{r.note}</div>
                      {!r.fits && <div className="small warn-text">Área {r.areaCm[0]}×{r.areaCm[1]} cm: este letrero se corta por partes</div>}
                      {blocked && <div className="small warn-text">No corta acrílico transparente/blanco</div>}
                    </td>
                    <td>{r.price ? money(r.price) : '—'}</td>
                    <td>{Math.round(r.minutes)} min</td>
                    <td>{money(r.perSign)}{r.id === 'maquila' ? ' (servicio)' : ' (tu tiempo)'}</td>
                    <td>{r.id === 'maquila' ? '—' : money(Math.max(0, r.saving))}</td>
                    <td>{blocked ? '—' : r.payback ? <span className={`margin ${r.payback <= 6 ? 'ok' : r.payback <= 12 ? 'mid' : 'low'}`}>{r.payback < 1 ? '< 1 mes' : `${Math.ceil(r.payback)} meses`}</span> : '—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <p className="muted small">El costo de “tu tiempo” usa la mano de obra de la pestaña Costos ({money(costs?.laborHour ?? DEFAULT_COSTS.laborHour)}/h). La app ya genera DXF y G-code para cualquier láser o CNC (en cada pedido → Archivos).</p>
      </section>
      <section className="card">
        <h2>Taller mínimo para empezar</h2>
        <ul className="quote-lines">
          <li><span>Cautín regulable + soldadura + pinzas (kit Truper CAU-25ERK)</span><span>≈ $565</span></li>
          <li><span>Multímetro (probar cadenas y fuente)</span><span>≈ $250–$500</span></li>
          <li><span>Taladro + broca de 5 mm (si no hay láser)</span><span>≈ $800–$1,500</span></li>
          <li><span>Pistola de silicón / pegamento para LED</span><span>≈ $150</span></li>
          <li><span>Guantes, lentes y extintor (127 V y láser)</span><span>≈ $600</span></li>
        </ul>
      </section>
    </>
  )
}

// Un renglón de la lista con sus proveedores (mínimo 5 por material)
function BuyRow({ item, qty, category }) {
  const list = category ? suppliersFor(category) : []
  return (
    <li>
      <div className="buy-main"><span>{item}</span><strong>{qty}</strong></div>
      {list.length > 0 && (
        <div className="buy-where">
          {list.map((x) => <a key={x.name} href={x.url} target="_blank" rel="noreferrer" title={`${x.what} · ${x.price}`}>{x.name}</a>)}
        </div>
      )}
    </li>
  )
}

// Fotos reales de la muestra de cada acabado (se repiten en la placa a su tamaño real)
function RealTextures({ canEdit }) {
  const [textures, setTextures] = useState({})
  const [busy, setBusy] = useState('')
  const [msg, setMsg] = useState('')
  const [tile, setTile] = useState({})
  const [source, setSource] = useState({})
  const reload = () => refreshPublicSettings().then((s) => setTextures(s.textures || {}))
  useEffect(() => {
    reload()
  }, [])
  const upload = (finish) => async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setBusy(finish)
    setMsg('')
    try {
      await api.saveTexture(finish, { image: await fileToJpeg(file, 1400, 0.85), tileCm: tile[finish] || 60, source: source[finish] || '' })
      await reload()
    } catch (err) {
      setMsg(err.message)
    } finally {
      setBusy('')
    }
  }
  const remove = async (finish) => {
    await api.deleteTexture(finish).catch((err) => setMsg(err.message))
    reload()
  }
  return (
    <>
      <p className="muted small">
        Sube una foto de la <b>muestra real</b> de cada material (el vinil o el acrílico que le compras al proveedor), tomada de frente y con buena luz.
        La vista previa la repite a su tamaño real. Usa fotos tuyas o imágenes que el proveedor te autorice: las de sus tiendas tienen derechos de autor.
      </p>
      {msg && <p className="error">{msg}</p>}
      <div className="texture-grid">
        {FINISHES.filter((f) => f.id !== 'liso').map((f) => {
          const t = textures[f.id]
          const cat = FINISH_MATERIAL[f.id]
          return (
            <article key={f.id} className="texture-card">
              <FinishSwatch finish={f.id} photo={t} />
              <div className="row between">
                <strong>{f.group} · {f.name}</strong>
                <span className={`margin ${t ? 'ok' : 'mid'}`}>{t ? 'foto real' : 'simulada'}</span>
              </div>
              {t?.source && <span className="muted small">{t.source} · se repite cada {t.tileCm} cm</span>}
              {canEdit && (
                <div className="texture-form">
                  <input className="input sm" placeholder="Proveedor / modelo" value={source[f.id] ?? ''} onChange={(e) => setSource({ ...source, [f.id]: e.target.value })} />
                  <input className="input sm" type="number" min="5" max="300" title="Cuántos cm mide lo que sale en la foto" placeholder="cm" value={tile[f.id] ?? ''} onChange={(e) => setTile({ ...tile, [f.id]: +e.target.value })} />
                  <label className="btn ghost sm file-btn">
                    <input type="file" accept="image/*" onChange={upload(f.id)} disabled={busy === f.id} />
                    {busy === f.id ? 'Subiendo…' : t ? 'Cambiar foto' : 'Subir foto'}
                  </label>
                  {t && <button className="link-btn danger" onClick={() => remove(f.id)}>Quitar</button>}
                </div>
              )}
              <div className="buy-where">
                {suppliersFor(cat).map((x) => <a key={x.name} href={x.url} target="_blank" rel="noreferrer" title={x.what}>{x.name}</a>)}
              </div>
            </article>
          )
        })}
      </div>
    </>
  )
}
