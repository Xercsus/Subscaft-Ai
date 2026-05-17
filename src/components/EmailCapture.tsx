'use client'

import { useState, useEffect } from 'react'

interface EmailCaptureProps {
  trigger?: 'auto' | 'manual'
  delay?: number // ms before auto popup
  subtitleCount?: number
}

export default function EmailCapture({
  trigger = 'auto',
  delay = 30000,
  subtitleCount = 0,
}: EmailCaptureProps) {
  const [show, setShow] = useState(false)
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [dismissed, setDismissed] = useState(false)

  // Auto-show after delay or after generating subtitles
  useEffect(() => {
    // Don't show if already dismissed or subscribed
    const alreadySubscribed = localStorage.getItem('subscraft_subscribed')
    if (alreadySubscribed || dismissed) return

    if (trigger === 'auto') {
      // Show after delay
      const timer = setTimeout(() => setShow(true), delay)
      return () => clearTimeout(timer)
    }
  }, [trigger, delay, dismissed])

  // Show after first subtitle generation
  useEffect(() => {
    if (subtitleCount === 4) {
      const subscribed = localStorage.getItem('subscraft_subscribed')
      if (!subscribed && !dismissed) {
        setTimeout(() => setShow(true), 2000)
      }
    }
  }, [subtitleCount, dismissed])

  const handleSubmit = async () => {
    if (!email || !email.includes('@')) {
      setErrorMsg('Please enter a valid email')
      setStatus('error')
      return
    }

    setStatus('loading')
    setErrorMsg('')

    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name }),
      })

      const data = await res.json()

      if (!res.ok) throw new Error(data.error || 'Failed')

      setStatus('success')
      localStorage.setItem('subscraft_subscribed', 'true')

      // Auto close after 4 seconds
      setTimeout(() => setShow(false), 4000)

    } catch (err: any) {
      setErrorMsg(err.message || 'Something went wrong')
      setStatus('error')
    }
  }

  const handleDismiss = () => {
    setShow(false)
    setDismissed(true)
  }

  if (!show) return null

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={handleDismiss}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(4px)',
          zIndex: 1000,
          animation: 'fadeIn 0.3s ease',
        }}
      />

      {/* Modal */}
      <div style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 1001,
        width: '100%',
        maxWidth: '460px',
        animation: 'popIn 0.4s cubic-bezier(.36,.07,.19,.97)',
      }}>
        <div style={{
          background: '#13151a',
          border: '1px solid #272b36',
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
        }}>

          {/* ── Success State ────────────────────── */}
          {status === 'success' ? (
            <div style={{ padding: '40px 32px', textAlign: 'center' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎉</div>
              <h2 style={{ color: '#4ce8a8', fontSize: '22px', fontWeight: 800, margin: '0 0 8px' }}>
                You're In!
              </h2>
              <p style={{ color: '#c8cad0', fontSize: '14px', lineHeight: 1.6, margin: '0 0 16px' }}>
                Check your email for the <strong style={{ color: '#e8a84c' }}>Subtitle Mastery Guide</strong>
                and pro tips for viral content.
              </p>
              <div style={{
                padding: '12px 16px',
                background: 'rgba(76,232,168,0.08)',
                border: '1px solid rgba(76,232,168,0.2)',
                borderRadius: '8px',
                fontSize: '12px',
                color: '#4ce8a8',
                fontFamily: 'monospace',
              }}>
                ✅ Guide sent to {email}
              </div>
            </div>
          ) : (
            <>
              {/* ── Header Banner ─────────────────── */}
              <div style={{
                background: 'linear-gradient(135deg, rgba(232,168,76,0.15), rgba(232,120,76,0.1))',
                padding: '28px 28px 20px',
                position: 'relative',
              }}>
                {/* Close button */}
                <button
                  onClick={handleDismiss}
                  style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    background: 'rgba(255,255,255,0.1)',
                    border: 'none',
                    borderRadius: '50%',
                    width: '28px',
                    height: '28px',
                    color: '#6b7080',
                    fontSize: '14px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  ✕
                </button>

                <div style={{ fontSize: '36px', marginBottom: '12px' }}>🎬</div>
                <h2 style={{ color: '#e8eaf0', fontSize: '20px', fontWeight: 800, margin: '0 0 6px', lineHeight: 1.3 }}>
                  Get the Free<br />
                  <span style={{ color: '#e8a84c' }}>Subtitle Mastery Guide</span>
                </h2>
                <p style={{ color: '#a0a3b0', fontSize: '13px', lineHeight: 1.5, margin: 0 }}>
                  5 viral subtitle styles + platform export cheat sheet
                </p>
              </div>

              {/* ── What you get ──────────────────── */}
              <div style={{ padding: '16px 28px 0' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                  {[
                    { emoji: '📝', text: '5 viral subtitle animation styles' },
                    { emoji: '🎨', text: 'Color combos for max readability' },
                    { emoji: '📱', text: 'Platform export cheat sheet' },
                    { emoji: '⚡', text: 'Pro sync & timing tips' },
                  ].map(item => (
                    <div key={item.text} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '14px', flexShrink: 0 }}>{item.emoji}</span>
                      <span style={{ fontSize: '13px', color: '#c8cad0' }}>{item.text}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Form ──────────────────────────── */}
              <div style={{ padding: '0 28px 24px' }}>
                {/* Name field */}
                <input
                  type="text"
                  placeholder="Your name (optional)"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '11px 14px',
                    background: '#1c1f27',
                    border: '1px solid #272b36',
                    borderRadius: '8px',
                    color: '#e8eaf0',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    outline: 'none',
                    marginBottom: '8px',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.15s',
                  }}
                  onFocus={e => (e.currentTarget.style.borderColor = '#e8a84c')}
                  onBlur={e => (e.currentTarget.style.borderColor = '#272b36')}
                />

                {/* Email field */}
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setStatus('idle'); setErrorMsg('') }}
                  onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                  style={{
                    width: '100%',
                    padding: '11px 14px',
                    background: '#1c1f27',
                    border: `1px solid ${status === 'error' ? '#e84c6b' : '#272b36'}`,
                    borderRadius: '8px',
                    color: '#e8eaf0',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    outline: 'none',
                    marginBottom: '8px',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.15s',
                  }}
                  onFocus={e => (e.currentTarget.style.borderColor = '#e8a84c')}
                  onBlur={e => (e.currentTarget.style.borderColor = status === 'error' ? '#e84c6b' : '#272b36')}
                />

                {/* Error message */}
                {status === 'error' && errorMsg && (
                  <p style={{ fontSize: '12px', color: '#e84c6b', margin: '0 0 8px', fontFamily: 'monospace' }}>
                    ❌ {errorMsg}
                  </p>
                )}

                {/* Submit button */}
                <button
                  onClick={handleSubmit}
                  disabled={status === 'loading'}
                  style={{
                    width: '100%',
                    padding: '13px',
                    background: status === 'loading' ? '#272b36' : 'linear-gradient(135deg, #e8a84c, #e8764c)',
                    color: status === 'loading' ? '#6b7080' : '#000',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: 800,
                    cursor: status === 'loading' ? 'wait' : 'pointer',
                    fontFamily: 'inherit',
                    letterSpacing: '0.3px',
                    transition: 'opacity 0.15s',
                    boxShadow: status !== 'loading' ? '0 4px 20px rgba(232,168,76,0.3)' : 'none',
                  }}
                >
                  {status === 'loading' ? '⏳ Sending...' : '📬 Send Me the Guide (Free)'}
                </button>

                {/* Privacy note */}
                <p style={{ fontSize: '10px', color: '#3a3f4d', textAlign: 'center', margin: '10px 0 0', fontFamily: 'monospace', lineHeight: 1.5 }}>
                  🔒 No spam ever · Unsubscribe anytime · We respect your inbox
                </p>
              </div>

              {/* ── Social proof ──────────────────── */}
              <div style={{
                padding: '12px 28px',
                borderTop: '1px solid #272b36',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}>
                <div style={{ display: 'flex' }}>
                  {['🧑‍💻', '👩‍🎨', '🧑‍🎤', '👨‍💼'].map((e, i) => (
                    <span key={i} style={{ fontSize: '16px', marginLeft: i > 0 ? '-4px' : 0 }}>{e}</span>
                  ))}
                </div>
                <p style={{ fontSize: '11px', color: '#6b7080', margin: 0 }}>
                  Join <strong style={{ color: '#e8a84c' }}>500+</strong> creators using Subscraft AI
                </p>
              </div>
            </>
          )}

        </div>
      </div>

      {/* Animations */}
      <style>{`
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
        @keyframes popIn {
          0% { opacity:0; transform:translate(-50%,-50%) scale(0.85); }
          100% { opacity:1; transform:translate(-50%,-50%) scale(1); }
        }
      `}</style>
    </>
  )
}