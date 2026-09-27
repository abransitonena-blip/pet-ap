// Modelos de inicio por giro de negocio (sin puntos: se calculan al cargar)
import { newLedLine } from './ledSign.js'

const L = newLedLine
export const LED_MODELS = [
  { name: 'Abierto', d: { style: 'contorno', pitchMm: 12, shape: 'pill', board: 'blanco', lines: [L({ text: 'ABIERTO', font: 'Anton', heightMm: 120, color: 'rojo', icon: 'estrella' })] } },
  { name: 'Taquería', d: { style: 'contorno', pitchMm: 12, board: 'arena', lines: [L({ text: 'TACOS', font: 'Alfa Slab One', heightMm: 130, color: 'ambar', icon: 'taco' }), L({ text: 'al pastor', font: 'Kaushan Script', heightMm: 70, color: 'verde' })] } },
  { name: 'Café', d: { style: 'trazo', pitchMm: 10, shape: 'arch', board: 'rosapalo', lines: [L({ text: 'Café', font: 'Pacifico', heightMm: 130, color: 'calido', icon: 'cafe', iconPos: 'right' })] } },
  { name: 'Pet shop', d: { style: 'trazo', pitchMm: 10, shape: 'circle', board: 'rosa', lines: [L({ text: '', icon: 'perro', heightMm: 150, color: 'blanco' }), L({ text: 'PET SHOP', font: 'Fredoka', heightMm: 60, color: 'blanco', bold: true })] } },
  { name: 'Baños', d: { style: 'trazo', pitchMm: 9, shape: 'round', board: 'blanco', lines: [L({ text: 'BAÑOS', font: 'Poppins', heightMm: 80, color: 'azul', bold: true, icon: 'wc' })] } },
  { name: 'Salida', d: { style: 'relleno', pitchMm: 10, shape: 'rect', board: 'salvia', lines: [L({ text: 'SALIDA', font: 'Archivo Black', heightMm: 90, color: 'verde', icon: 'derecha', iconPos: 'right' })] } },
  { name: 'Open', d: { style: 'trazo', pitchMm: 10, board: 'transparente', mount: 'colgante', lines: [L({ text: 'Open', font: 'Pacifico', heightMm: 140, color: 'rosa', icon: 'corazon', iconPos: 'right' })] } },
  { name: 'Pizza', d: { style: 'contorno', pitchMm: 12, shape: 'hex', board: 'arena', lines: [L({ text: 'PIZZA', font: 'Titan One', heightMm: 110, color: 'rojo', icon: 'pizza' })] } },
  { name: 'Barber', d: { style: 'relleno', pitchMm: 11, board: 'gris', animation: 'parpadeo', lines: [L({ text: 'BARBER', font: 'Bebas Neue', heightMm: 150, color: 'azul', icon: 'tijeras' })] } },
  { name: 'Matriz', d: { style: 'matriz', animation: 'secuencial', board: 'blanco', lines: [L({ text: 'CAFE', heightMm: 120, color: 'ambar' })] } },
  { name: 'Café madera', d: { style: 'trazo', pitchMm: 10, shape: 'round', finish: 'nogal', frame: { on: true, color: 'calido', mix: 'solido' }, lines: [L({ text: 'Coffee', font: 'Pacifico', heightMm: 130, color: 'calido', icon: 'cafe', iconPos: 'right' })] } },
  { name: 'Bar', d: { style: 'trazo', pitchMm: 12, shape: 'rect', finish: 'concreto', animation: 'secuencial', frame: { on: true, double: true, color: 'rosa', color2: 'azul', mix: 'alternado' }, lines: [L({ text: 'BAR', font: 'Monoton', heightMm: 160, color: 'rosa', icon: 'coctel' })] } },
  { name: 'Boutique', d: { style: 'trazo', pitchMm: 9, shape: 'arch', finish: 'rosaoro', frame: { on: true, color: 'blanco' }, lines: [L({ text: 'Boutique', font: 'Great Vibes', heightMm: 120, color: 'blanco' })] } },
  { name: 'Fiesta', d: { style: 'contorno', pitchMm: 11, shape: 'pill', finish: 'marmol', animation: 'respirar', frame: { on: true, mix: 'arcoiris' }, lines: [L({ text: 'PARTY', font: 'Bungee', heightMm: 120, color: 'rosa', mix: 'arcoiris' })] } },
  { name: 'Mesa', d: { style: 'trazo', pitchMm: 9, board: 'transparente', mount: 'base', lines: [L({ text: 'Bienvenidos', font: 'Great Vibes', heightMm: 100, color: 'calido', icon: 'brillos' })] } }
]
