// Íconos de interfaz: trazo uniforme de Lucide (licencia ISC). Para lo que va dentro del letrero se usan los íconos LED.
import {
  Bookmark, Box, Camera, Check, ChevronRight, CircleUser, Clock, Download, Gift, Image, Layers, LogOut, Mail,
  MessageCircle, Moon, Package, Palette, Plus, Ruler, Settings2, Share2, ShieldCheck, Sparkles, Sun, Sunset,
  RotateCw, Truck, Type, Wallet, Zap, X, Lightbulb, Copy, Trash2, Eye, Wifi, SlidersHorizontal
} from 'lucide-static'

const SVGS = {
  bookmark: Bookmark, box: Box, camera: Camera, check: Check, next: ChevronRight, user: CircleUser, clock: Clock,
  download: Download, gift: Gift, image: Image, layers: Layers, logout: LogOut, mail: Mail, chat: MessageCircle,
  moon: Moon, package: Package, palette: Palette, plus: Plus, ruler: Ruler, settings: Settings2, share: Share2,
  shield: ShieldCheck, sparkles: Sparkles, sun: Sun, sunset: Sunset, rotate: RotateCw, truck: Truck, type: Type,
  wallet: Wallet, bolt: Zap, x: X, bulb: Lightbulb, copy: Copy, trash: Trash2, eye: Eye, wifi: Wifi, sliders: SlidersHorizontal
}
const inner = (svg) => svg.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '')
const BODIES = Object.fromEntries(Object.entries(SVGS).map(([k, v]) => [k, inner(v)]))

export default function Icon({ name, size = 18, stroke = 1.8, className = '', title }) {
  const body = BODIES[name]
  if (!body) return null
  return (
    <svg
      className={`ui-icon ${className}`}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={title ? undefined : true}
      role={title ? 'img' : undefined}
      dangerouslySetInnerHTML={{ __html: (title ? `<title>${title}</title>` : '') + body }}
    />
  )
}
