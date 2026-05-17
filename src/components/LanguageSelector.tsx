'use client'

import { useState } from 'react'
import { LANGUAGES, Language } from '@/lib/languages'

interface LanguageSelectorProps {
  selected: string
  onChange: (code: string) => void
  disabled?: boolean
}

export default function LanguageSelector({
  selected,
  onChange,
  disabled = false,
}: LanguageSelectorProps) {
  const [open, setOpen] = useState(false)

  const current = LANGUAGES.find((l) => l.code === selected) ?? LANGUAGES[0]

  return (
    <div style={{ position: 'relative' }}>

      {/* Trigger Button */}
      <button
        onClick={() => !disabled && setOpen((p) => !p)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 12px',
          background: '#1c1f27',
          border: `1px solid ${open ? '#e8a84c' : '#272b36'}`,
          borderRadius: '8px',
          color: disabled ? '#6b7080' : '#e8eaf0',
          fontSize: '13px',
          fontWeight: 600,
          cursor: disabled ? 'not-allowed' : 'pointer',
          fontFamily: 'inherit',
          whiteSpace: 'nowrap',
          opacity: disabled ? 0.5 : 1,
          transition: 'border-color 0.15s',
        }}
      >
        <span>{current.flag}</span>
        <span>{current.label}</span>
        <span style={{ color: '#6b7080', fontSize: '10px' }}>
          {open ? '▲' : '▼'}
        </span>
      </button>

      {/* Dropdown */}
      {open && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 10,
            }}
          />

          {/* Menu */}
          <div style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            zIndex: 20,
            background: '#1c1f27',
            border: '1px solid #272b36',
            borderRadius: '10px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            minWidth: '220px',
            maxHeight: '280px',
            overflowY: 'auto',
            padding: '6px',
          }}>
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => { onChange(lang.code); setOpen(false) }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '8px 10px',
                  borderRadius: '6px',
                  border: 'none',
                  background: selected === lang.code ? 'rgba(232,168,76,0.1)' : 'transparent',
                  color: selected === lang.code ? '#e8a84c' : '#e8eaf0',
                  fontSize: '13px',
                  fontWeight: selected === lang.code ? 700 : 400,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  textAlign: 'left',
                  transition: 'background 0.1s',
                }}
                onMouseEnter={(e) => {
                  if (selected !== lang.code)
                    (e.target as HTMLElement).style.background = 'rgba(255,255,255,0.05)'
                }}
                onMouseLeave={(e) => {
                  if (selected !== lang.code)
                    (e.target as HTMLElement).style.background = 'transparent'
                }}
              >
                <span style={{ fontSize: '16px' }}>{lang.flag}</span>
                <span>{lang.label}</span>
                {selected === lang.code && (
                  <span style={{ marginLeft: 'auto', fontSize: '12px' }}>✓</span>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}