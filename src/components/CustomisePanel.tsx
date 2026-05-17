'use client'

import { SubtitleStyle, SubtitleAnimation } from '@/types/subtitle'

interface CustomisePanelProps {
  style: SubtitleStyle
  onChange: (style: SubtitleStyle) => void
}

const FONTS = [
  { label: 'Inter', value: 'Inter, sans-serif' },
  { label: 'Arial', value: 'Arial, sans-serif' },
  { label: 'Georgia', value: 'Georgia, serif' },
  { label: 'Courier New', value: 'Courier New, monospace' },
  { label: 'Impact', value: 'Impact, sans-serif' },
  { label: 'Trebuchet MS', value: 'Trebuchet MS, sans-serif' },
  { label: 'Verdana', value: 'Verdana, sans-serif' },
]

const FONT_WEIGHTS = [
  { label: 'Normal', value: '400' },
  { label: 'Semi', value: '600' },
  { label: 'Bold', value: '700' },
  { label: 'Black', value: '900' },
]

const PRESET_COLORS = [
  '#ffffff', '#000000', '#ffff00', '#00ff00',
  '#ff4444', '#4488ff', '#ff8800', '#ff44ff',
  '#00ffff', '#ff6699',
]

const ANIMATIONS: { id: SubtitleAnimation; label: string; emoji: string; desc: string }[] = [
  { id: 'none',        label: 'None',         emoji: '—',  desc: 'No animation' },
  { id: 'fade',        label: 'Fade',         emoji: '👻', desc: 'Smooth fade in' },
  { id: 'slide-up',    label: 'Slide Up',     emoji: '⬆️', desc: 'Slides up into position' },
  { id: 'slide-down',  label: 'Slide Down',   emoji: '⬇️', desc: 'Slides down into position' },
  { id: 'pop',         label: 'Pop',          emoji: '💥', desc: 'Pops with scale' },
  { id: 'bounce',      label: 'Bounce',       emoji: '🏀', desc: 'Bounces in from top' },
  { id: 'blur',        label: 'Blur',         emoji: '🌫️', desc: 'Blur to focus' },
  { id: 'word-by-word',label: 'Word by Word', emoji: '📝', desc: 'One word at a time' },
  { id: 'char-by-char',label: 'Char by Char', emoji: '🔤', desc: 'One character at a time' },
  { id: 'typewriter',  label: 'Typewriter',   emoji: '⌨️', desc: 'Typewriter with cursor' },
  { id: 'karaoke',     label: 'Karaoke',      emoji: '🎤', desc: 'Highlight word by word' },
]

export default function CustomisePanel({ style, onChange }: CustomisePanelProps) {
  const update = (key: keyof SubtitleStyle, value: any) => onChange({ ...style, [key]: value })

  const hexToRgba = (hex: string, opacity: number) => {
    const clean = hex.replace('#', '')
    const r = parseInt(clean.slice(0, 2), 16)
    const g = parseInt(clean.slice(2, 4), 16)
    const b = parseInt(clean.slice(4, 6), 16)
    return `rgba(${r},${g},${b},${opacity})`
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0, overflowY: 'auto', flex: 1 }}>

      {/* ── ANIMATIONS ── */}
      <Section title="🎬 Animation">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px' }}>
          {ANIMATIONS.map(anim => (
            <button
              key={anim.id}
              onClick={() => update('animation', anim.id)}
              title={anim.desc}
              style={{
                padding: '7px 8px',
                borderRadius: '7px',
                border: `1px solid ${style.animation === anim.id ? '#e8a84c' : '#272b36'}`,
                background: style.animation === anim.id ? 'rgba(232,168,76,0.12)' : '#1c1f27',
                color: style.animation === anim.id ? '#e8a84c' : '#c8cad0',
                fontSize: '11px',
                fontWeight: style.animation === anim.id ? 700 : 400,
                cursor: 'pointer',
                fontFamily: 'inherit',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
              }}
            >
              <span>{anim.emoji}</span>
              <span>{anim.label}</span>
            </button>
          ))}
        </div>

        {/* Speed */}
        {!['word-by-word', 'char-by-char', 'typewriter', 'karaoke', 'none'].includes(style.animation) && (
          <>
            <Label>Speed</Label>
            <div style={{ display: 'flex', gap: '6px' }}>
              {(['slow', 'normal', 'fast'] as const).map(s => (
                <button key={s} onClick={() => update('animationSpeed', s)} style={{ flex: 1, padding: '6px', borderRadius: '6px', fontSize: '11px', fontWeight: 600, cursor: 'pointer', border: `1px solid ${style.animationSpeed === s ? '#e8a84c' : '#272b36'}`, background: style.animationSpeed === s ? 'rgba(232,168,76,0.1)' : '#1c1f27', color: style.animationSpeed === s ? '#e8a84c' : '#6b7080', fontFamily: 'inherit' }}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </>
        )}

        {/* Karaoke highlight color */}
        {(style.animation === 'karaoke' || style.animation === 'word-by-word') && (
          <>
            <Label>Highlight Color</Label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {['#ffff00', '#ff4444', '#4ce8a8', '#4c8ee8', '#ff8800', '#ff44ff'].map(c => (
                <button key={c} onClick={() => update('highlightColor', c)} style={{ width: '24px', height: '24px', borderRadius: '50%', background: c, border: style.highlightColor === c ? '2px solid #fff' : '2px solid transparent', cursor: 'pointer', outline: 'none' }} />
              ))}
              <input type="color" value={style.highlightColor} onChange={(e) => update('highlightColor', e.target.value)} style={{ width: '32px', height: '32px', border: 'none', background: 'none', cursor: 'pointer' }} />
            </div>
          </>
        )}
      </Section>

      {/* ── POSITION ── */}
      <Section title="📍 Position & Size">
        {/* Preset positions */}
        <Label>Preset Position</Label>
        <div style={{ display: 'flex', gap: '6px' }}>
          {(['top', 'bottom', 'custom'] as const).map(pos => (
            <button key={pos} onClick={() => {
              if (pos === 'custom') {
                update('position', 'custom')
              } else {
                update('position', pos)
              }
            }} style={{ flex: 1, padding: '7px', borderRadius: '6px', fontSize: '11px', fontWeight: 600, cursor: 'pointer', border: `1px solid ${style.position === pos ? '#e8a84c' : '#272b36'}`, background: style.position === pos ? 'rgba(232,168,76,0.1)' : '#1c1f27', color: style.position === pos ? '#e8a84c' : '#6b7080', fontFamily: 'inherit' }}>
              {pos === 'top' ? '⬆ Top' : pos === 'bottom' ? '⬇ Bottom' : '✥ Free'}
            </button>
          ))}
        </div>

        {/* Free position controls */}
        {style.position === 'custom' && (
          <>
            <div style={{ padding: '10px 12px', background: 'rgba(232,168,76,0.05)', border: '1px solid rgba(232,168,76,0.15)', borderRadius: '7px', fontSize: '11px', color: '#a87530', fontFamily: 'monospace', lineHeight: 1.5 }}>
              ✥ Drag the subtitle directly on the video to position it freely.
            </div>

            <Label>X Position — {Math.round(style.x)}%</Label>
            <input type="range" min={5} max={95} step={1} value={style.x} onChange={(e) => update('x', Number(e.target.value))} style={rangeStyle} />

            <Label>Y Position — {Math.round(style.y)}%</Label>
            <input type="range" min={5} max={95} step={1} value={style.y} onChange={(e) => update('y', Number(e.target.value))} style={rangeStyle} />
          </>
        )}

        {/* Visual position picker */}
        {style.position === 'custom' && (
          <>
            <Label>Quick Position</Label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px' }}>
              {[
                { label: '↖', x: 15, y: 15 }, { label: '⬆', x: 50, y: 10 }, { label: '↗', x: 85, y: 15 },
                { label: '←', x: 15, y: 50 }, { label: '•', x: 50, y: 50 }, { label: '→', x: 85, y: 50 },
                { label: '↙', x: 15, y: 85 }, { label: '⬇', x: 50, y: 88 }, { label: '↘', x: 85, y: 85 },
              ].map(p => (
                <button key={p.label} onClick={() => { update('x', p.x); onChange({ ...style, x: p.x, y: p.y }) }} style={{ padding: '8px', borderRadius: '5px', border: '1px solid #272b36', background: '#1c1f27', color: '#6b7080', fontSize: '14px', cursor: 'pointer', fontFamily: 'inherit' }}>
                  {p.label}
                </button>
              ))}
            </div>
          </>
        )}

        <Label>Max Width — {style.maxWidth}%</Label>
        <input type="range" min={20} max={100} step={1} value={style.maxWidth} onChange={(e) => update('maxWidth', Number(e.target.value))} style={rangeStyle} />
      </Section>

      {/* ── FONT ── */}
      <Section title="✏️ Font">
        <Label>Family</Label>
        <select value={style.fontFamily} onChange={(e) => update('fontFamily', e.target.value)} style={selectStyle}>
          {FONTS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
        </select>

        <Label>Size — {style.fontSize}px</Label>
        <input type="range" min={10} max={72} step={1} value={style.fontSize} onChange={(e) => update('fontSize', Number(e.target.value))} style={rangeStyle} />

        <Label>Weight</Label>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {FONT_WEIGHTS.map(w => (
            <button key={w.value} onClick={() => update('fontWeight', w.value)} style={{ padding: '5px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: w.value as any, cursor: 'pointer', border: `1px solid ${style.fontWeight === w.value ? '#e8a84c' : '#272b36'}`, background: style.fontWeight === w.value ? 'rgba(232,168,76,0.1)' : '#1c1f27', color: style.fontWeight === w.value ? '#e8a84c' : '#e8eaf0', fontFamily: 'inherit' }}>
              {w.label}
            </button>
          ))}
        </div>

        <Label>Letter Spacing — {style.letterSpacing}px</Label>
        <input type="range" min={-2} max={10} step={0.5} value={style.letterSpacing} onChange={(e) => update('letterSpacing', Number(e.target.value))} style={rangeStyle} />

        <Label>Alignment</Label>
        <div style={{ display: 'flex', gap: '6px' }}>
          {(['left', 'center', 'right'] as const).map(align => (
            <button key={align} onClick={() => update('textAlign', align)} style={{ flex: 1, padding: '6px', borderRadius: '6px', fontSize: '14px', cursor: 'pointer', border: `1px solid ${style.textAlign === align ? '#e8a84c' : '#272b36'}`, background: style.textAlign === align ? 'rgba(232,168,76,0.1)' : '#1c1f27', color: style.textAlign === align ? '#e8a84c' : '#e8eaf0' }}>
              {align === 'left' ? '⬅' : align === 'center' ? '↔' : '➡'}
            </button>
          ))}
        </div>

        {/* Text Stroke */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Label>Text Stroke</Label>
          <button
            onClick={() => update('textStroke', !style.textStroke)}
            style={{ padding: '4px 12px', borderRadius: '5px', border: `1px solid ${style.textStroke ? '#e8a84c' : '#272b36'}`, background: style.textStroke ? 'rgba(232,168,76,0.1)' : '#1c1f27', color: style.textStroke ? '#e8a84c' : '#6b7080', fontSize: '11px', cursor: 'pointer', fontFamily: 'inherit' }}
          >
            {style.textStroke ? 'ON' : 'OFF'}
          </button>
        </div>
        {style.textStroke && (
          <>
            <Label>Stroke Color</Label>
            <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
              {['#000000', '#ffffff', '#ff4444', '#4c8ee8', '#e8a84c'].map(c => (
                <button key={c} onClick={() => update('textStrokeColor', c)} style={{ width: '24px', height: '24px', borderRadius: '50%', background: c, border: style.textStrokeColor === c ? '2px solid #e8a84c' : '2px solid transparent', cursor: 'pointer', outline: 'none' }} />
              ))}
              <input type="color" value={style.textStrokeColor} onChange={(e) => update('textStrokeColor', e.target.value)} style={{ width: '32px', height: '32px', border: 'none', background: 'none', cursor: 'pointer' }} />
            </div>
          </>
        )}
      </Section>

      {/* ── COLORS ── */}
      <Section title="🎨 Colors">
        <Label>Text Color</Label>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
            {PRESET_COLORS.map(c => (
              <button key={c} onClick={() => update('color', c)} style={{ width: '24px', height: '24px', borderRadius: '50%', background: c, border: style.color === c ? '2px solid #e8a84c' : '2px solid #3a3f4d', cursor: 'pointer', outline: 'none' }} />
            ))}
          </div>
          <input type="color" value={style.color} onChange={(e) => update('color', e.target.value)} style={{ width: '32px', height: '32px', border: 'none', background: 'none', cursor: 'pointer' }} />
        </div>

        <Label>Background Color</Label>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
            {PRESET_COLORS.map(c => (
              <button key={c} onClick={() => {
                const clean = c.replace('#', '')
                const r = parseInt(clean.slice(0, 2), 16)
                const g = parseInt(clean.slice(2, 4), 16)
                const b = parseInt(clean.slice(4, 6), 16)
                update('backgroundColor', `rgba(${r},${g},${b},${style.backgroundOpacity})`)
              }} style={{ width: '24px', height: '24px', borderRadius: '50%', background: c, border: '2px solid #3a3f4d', cursor: 'pointer', outline: 'none' }} />
            ))}
          </div>
          <input type="color" onChange={(e) => {
            const clean = e.target.value.replace('#', '')
            const r = parseInt(clean.slice(0, 2), 16)
            const g = parseInt(clean.slice(2, 4), 16)
            const b = parseInt(clean.slice(4, 6), 16)
            update('backgroundColor', `rgba(${r},${g},${b},${style.backgroundOpacity})`)
          }} style={{ width: '32px', height: '32px', border: 'none', background: 'none', cursor: 'pointer' }} />
        </div>

        <Label>Background Opacity — {Math.round(style.backgroundOpacity * 100)}%</Label>
        <input type="range" min={0} max={1} step={0.05} value={style.backgroundOpacity} onChange={(e) => {
          const opacity = Number(e.target.value)
          const match = style.backgroundColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)
          if (match) update('backgroundColor', `rgba(${match[1]},${match[2]},${match[3]},${opacity})`)
          update('backgroundOpacity', opacity)
        }} style={rangeStyle} />
      </Section>

      {/* ── PREVIEW ── */}
      <Section title="👁 Preview">
        <div style={{ background: '#000', borderRadius: '8px', height: '90px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px', position: 'relative', overflow: 'hidden' }}>
          <div style={{
            fontFamily: style.fontFamily,
            fontSize: `${Math.min(style.fontSize, 18)}px`,
            fontWeight: style.fontWeight as any,
            color: style.color,
            backgroundColor: style.backgroundColor,
            textAlign: style.textAlign,
            padding: '5px 12px',
            borderRadius: '5px',
            letterSpacing: `${style.letterSpacing}px`,
            WebkitTextStroke: style.textStroke ? `1px ${style.textStrokeColor}` : 'none',
            textShadow: style.textStroke ? 'none' : '0 1px 6px rgba(0,0,0,0.8)',
            maxWidth: `${style.maxWidth}%`,
            width: `${style.maxWidth}%`,
          }}>
            {style.animation === 'karaoke'
              ? <span>
                  <span style={{ color: style.highlightColor, fontWeight: 900 }}>Sample </span>
                  <span>subtitle text</span>
                </span>
              : style.animation === 'word-by-word' ? 'Sample'
              : 'Sample subtitle text'}
          </div>
        </div>
      </Section>

    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ padding: '14px 16px', borderBottom: '1px solid #272b36' }}>
      <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: '#6b7080', marginBottom: '10px' }}>{title}</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>{children}</div>
    </div>
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return <p style={{ fontSize: '11px', color: '#6b7080', marginTop: '2px' }}>{children}</p>
}

const selectStyle: React.CSSProperties = { width: '100%', padding: '7px 10px', background: '#1c1f27', border: '1px solid #272b36', borderRadius: '6px', color: '#e8eaf0', fontSize: '13px', fontFamily: 'inherit', cursor: 'pointer' }
const rangeStyle: React.CSSProperties = { width: '100%', accentColor: '#e8a84c', cursor: 'pointer' }