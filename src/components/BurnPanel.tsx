'use client'

import { useState, useRef } from 'react'
import { Subtitle, SubtitleStyle } from '@/types/subtitle'
import { renderVideoWithSubtitles, convertWebMToMP4 } from '@/lib/canvasRenderer'

interface BurnPanelProps {
  subtitles: Subtitle[]
  videoFile: File | null
  style: SubtitleStyle
}

type Stage =
  | 'idle'
  | 'rendering'
  | 'converting'
  | 'done'
  | 'error'

interface StageInfo {
  label: string
  color: string
  bg: string
  border: string
}

const STAGE_INFO: Record<Stage, StageInfo> = {
  idle:       { label: 'Ready',      color: '#6b7080', bg: 'transparent',              border: '#272b36' },
  rendering:  { label: 'Rendering',  color: '#e8a84c', bg: 'rgba(232,168,76,0.08)',    border: '#e8a84c' },
  converting: { label: 'Converting', color: '#4c8ee8', bg: 'rgba(76,142,232,0.08)',    border: '#4c8ee8' },
  done:       { label: 'Done',       color: '#4ce8a8', bg: 'rgba(76,232,168,0.08)',    border: '#4ce8a8' },
  error:      { label: 'Error',      color: '#e84c6b', bg: 'rgba(232,76,107,0.08)',    border: '#e84c6b' },
}

const ANIMATION_LABELS: Record<string, string> = {
  none:         '— None',
  fade:         '👻 Fade In',
  'slide-up':   '⬆️ Slide Up',
  'slide-down': '⬇️ Slide Down',
  pop:          '💥 Pop',
  bounce:       '🏀 Bounce',
  blur:         '🌫️ Blur',
  'word-by-word': '📝 Word by Word',
  'char-by-char': '🔤 Char by Char',
  typewriter:   '⌨️ Typewriter',
  karaoke:      '🎤 Karaoke',
}

export default function BurnPanel({ subtitles, videoFile, style }: BurnPanelProps) {
  const [stage, setStage] = useState<Stage>('idle')
  const [renderPct, setRenderPct] = useState(0)
  const [convertPct, setConvertPct] = useState(0)
  const [message, setMessage] = useState('')
  const [outputUrl, setOutputUrl] = useState<string | null>(null)
  const [outputBlob, setOutputBlob] = useState<Blob | null>(null)
  const [error, setError] = useState('')
  const [outputFormat, setOutputFormat] = useState<'mp4' | 'webm'>('mp4')
  const [renderTime, setRenderTime] = useState<number | null>(null)
  const startTimeRef = useRef<number>(0)

  const canRender = subtitles.length > 0 && videoFile !== null
  const isWorking = stage === 'rendering' || stage === 'converting'
  const totalPct = stage === 'rendering'
    ? Math.round(renderPct * 0.7)
    : stage === 'converting'
    ? 70 + Math.round(convertPct * 0.3)
    : stage === 'done' ? 100 : 0

  // ── Start render ────────────────────────────────────
  const handleRender = async () => {
    if (!canRender || !videoFile) return

    setStage('rendering')
    setRenderPct(0)
    setConvertPct(0)
    setMessage('Initialising...')
    setOutputUrl(null)
    setOutputBlob(null)
    setError('')
    setRenderTime(null)
    startTimeRef.current = Date.now()

    renderVideoWithSubtitles({
      videoFile,
      subtitles,
      style,

      onProgress: (pct, msg) => {
        setRenderPct(pct)
        setMessage(msg)
      },

      onDone: async (webmBlob) => {
        const renderSecs = ((Date.now() - startTimeRef.current) / 1000).toFixed(1)

        if (outputFormat === 'webm') {
          const url = URL.createObjectURL(webmBlob)
          setOutputUrl(url)
          setOutputBlob(webmBlob)
          setRenderTime(parseFloat(renderSecs))
          setStage('done')
          setRenderPct(100)
          setMessage('WebM render complete!')
          return
        }

        // Convert to MP4
        setStage('converting')
        setConvertPct(0)
        setMessage('Starting MP4 conversion...')

        try {
          const mp4Blob = await convertWebMToMP4(webmBlob, (msg) => {
            setMessage(msg)
            setConvertPct(prev => Math.min(prev + 3, 95))
          })

          const url = URL.createObjectURL(mp4Blob)
          setOutputUrl(url)
          setOutputBlob(mp4Blob)
          setRenderTime(parseFloat(((Date.now() - startTimeRef.current) / 1000).toFixed(1)))
          setStage('done')
          setConvertPct(100)
          setMessage('MP4 ready!')

        } catch (err: any) {
          // Fallback to WebM if MP4 conversion fails
          console.warn('MP4 conversion failed, using WebM:', err)
          const url = URL.createObjectURL(webmBlob)
          setOutputUrl(url)
          setOutputBlob(webmBlob)
          setRenderTime(parseFloat(((Date.now() - startTimeRef.current) / 1000).toFixed(1)))
          setStage('done')
          setMessage('Done (WebM — MP4 conversion failed, try again)')
        }
      },

      onError: (msg) => {
        setError(msg)
        setStage('error')
      },
    })
  }

  // ── Download ─────────────────────────────────────────
  const handleDownload = () => {
    if (!outputUrl || !videoFile || !outputBlob) return
    const isMp4 = outputBlob.type === 'video/mp4'
    const ext = isMp4 ? 'mp4' : 'webm'
    const base = videoFile.name.replace(/\.[^/.]+$/, '')
    const a = document.createElement('a')
    a.href = outputUrl
    a.download = `${base}_subtitled.${ext}`
    a.click()
  }

  // ── Reset ────────────────────────────────────────────
  const handleReset = () => {
    if (outputUrl) URL.revokeObjectURL(outputUrl)
    setStage('idle')
    setRenderPct(0)
    setConvertPct(0)
    setMessage('')
    setOutputUrl(null)
    setOutputBlob(null)
    setError('')
    setRenderTime(null)
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '0px',
    }}>

      {/* ── Header ───────────────────────────────────── */}
      <div style={{
        padding: '16px',
        borderBottom: '1px solid #272b36',
        background: 'rgba(76,142,232,0.04)',
      }}>
        <p style={{ fontSize: '13px', fontWeight: 800, color: '#4c8ee8', marginBottom: '4px' }}>
          🎬 Render & Download Video
        </p>
        <p style={{ fontSize: '11px', color: '#6b7080', lineHeight: 1.6, fontFamily: 'monospace' }}>
          Renders all subtitle styles exactly as you see them —
          animations, karaoke, word-by-word, custom positions —
          then exports as <strong style={{ color: '#e8eaf0' }}>MP4</strong> or WebM.
        </p>
      </div>

      {/* ── Requirements ────────────────────────────────── */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #272b36' }}>
        <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: '#6b7080', marginBottom: '8px' }}>
          Requirements
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          {[
            { label: 'Video file loaded', met: videoFile !== null, value: videoFile?.name },
            { label: 'Subtitles generated', met: subtitles.length > 0, value: subtitles.length > 0 ? `${subtitles.length} segments` : undefined },
          ].map(req => (
            <div key={req.label} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '13px', flexShrink: 0 }}>{req.met ? '✅' : '❌'}</span>
              <span style={{ fontSize: '12px', color: req.met ? '#e8eaf0' : '#6b7080', flex: 1 }}>
                {req.label}
              </span>
              {req.value && (
                <span style={{ fontSize: '10px', fontFamily: 'monospace', color: '#4ce8a8', background: 'rgba(76,232,168,0.08)', padding: '1px 6px', borderRadius: '4px' }}>
                  {req.value}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Style Summary ──────────────────────────────── */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #272b36' }}>
        <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: '#6b7080', marginBottom: '8px' }}>
          Style to Render
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px' }}>
          {[
            { k: 'Animation', v: ANIMATION_LABELS[style.animation] ?? style.animation },
            { k: 'Font', v: style.fontFamily.split(',')[0] },
            { k: 'Size', v: `${style.fontSize}px` },
            { k: 'Weight', v: style.fontWeight },
            { k: 'Color', v: style.color },
            { k: 'Position', v: style.position === 'custom' ? `${Math.round(style.x)}%, ${Math.round(style.y)}%` : style.position },
            { k: 'Width', v: `${style.maxWidth}%` },
            { k: 'Stroke', v: style.textStroke ? `Yes (${style.textStrokeColor})` : 'No' },
          ].map(item => (
            <div key={item.k} style={{ fontSize: '11px', fontFamily: 'monospace', display: 'flex', flexDirection: 'column', gap: '1px' }}>
              <span style={{ color: '#6b7080', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{item.k}</span>
              <span style={{ color: '#c8cad0', fontSize: '11px' }}>{item.v}</span>
            </div>
          ))}
        </div>

        {/* Color swatch */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
          <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: style.color, border: '2px solid #272b36', flexShrink: 0 }} />
          <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: style.backgroundColor, border: '2px solid #272b36', flexShrink: 0 }} />
          {(style.animation === 'karaoke' || style.animation === 'word-by-word') && (
            <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: style.highlightColor, border: '2px solid #272b36', flexShrink: 0 }} />
          )}
          <span style={{ fontSize: '10px', color: '#3a3f4d', fontFamily: 'monospace' }}>
            text · bg{(style.animation === 'karaoke' || style.animation === 'word-by-word') ? ' · highlight' : ''}
          </span>
        </div>
      </div>

      {/* ── Format Selector ──────────────────────────── */}
      {stage === 'idle' && (
        <div style={{ padding: '12px 16px', borderBottom: '1px solid #272b36' }}>
          <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: '#6b7080', marginBottom: '8px' }}>
            Output Format
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            {([
              {
                id: 'mp4' as const,
                label: 'MP4',
                icon: '🎬',
                desc: 'Recommended · iPhone · Android · Universal',
                color: '#e8a84c',
                note: 'Slower (requires conversion)',
              },
              {
                id: 'webm' as const,
                label: 'WebM',
                icon: '⚡',
                desc: 'Chrome · Firefox · Web players',
                color: '#4c8ee8',
                note: 'Faster · Smaller file size',
              },
            ] as const).map(fmt => (
              <button
                key={fmt.id}
                onClick={() => setOutputFormat(fmt.id)}
                style={{
                  padding: '12px',
                  borderRadius: '10px',
                  border: `2px solid ${outputFormat === fmt.id ? fmt.color : '#272b36'}`,
                  background: outputFormat === fmt.id ? `rgba(${fmt.color === '#e8a84c' ? '232,168,76' : '76,142,232'},0.08)` : '#1c1f27',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s',
                  fontFamily: 'inherit',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  <span style={{ fontSize: '16px' }}>{fmt.icon}</span>
                  <span style={{ fontSize: '14px', fontWeight: 800, color: outputFormat === fmt.id ? fmt.color : '#e8eaf0' }}>
                    {fmt.label}
                  </span>
                  {outputFormat === fmt.id && (
                    <span style={{ marginLeft: 'auto', fontSize: '12px', color: fmt.color }}>✓</span>
                  )}
                </div>
                <p style={{ fontSize: '10px', color: '#6b7080', lineHeight: 1.4, margin: 0, fontFamily: 'monospace' }}>
                  {fmt.desc}
                </p>
                <p style={{ fontSize: '9px', color: outputFormat === fmt.id ? fmt.color : '#3a3f4d', margin: '3px 0 0', fontFamily: 'monospace' }}>
                  {fmt.note}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Main Content Area ────────────────────────── */}
      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>

        {/* ── Idle: Render Button ── */}
        {stage === 'idle' && (
          <>
            <button
              onClick={handleRender}
              disabled={!canRender}
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: '10px',
                border: 'none',
                background: !canRender
                  ? '#1c1f27'
                  : outputFormat === 'mp4'
                  ? 'linear-gradient(135deg, #e8a84c 0%, #e8764c 100%)'
                  : 'linear-gradient(135deg, #4c8ee8 0%, #4ce8a8 100%)',
                color: !canRender ? '#6b7080' : '#000',
                fontSize: '14px',
                fontWeight: 800,
                cursor: !canRender ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit',
                letterSpacing: '0.3px',
                transition: 'opacity 0.15s',
                boxShadow: canRender ? '0 4px 20px rgba(232,168,76,0.25)' : 'none',
              }}
              onMouseEnter={e => canRender && ((e.currentTarget as HTMLElement).style.opacity = '0.88')}
              onMouseLeave={e => ((e.currentTarget as HTMLElement).style.opacity = '1')}
            >
              {!canRender
                ? '⚠️ Add video + subtitles first'
                : `🎬 Render & Download ${outputFormat.toUpperCase()}`
              }
            </button>

            {canRender && (
              <p style={{ fontSize: '10px', color: '#3a3f4d', fontFamily: 'monospace', textAlign: 'center', lineHeight: 1.5 }}>
                Rendering happens in real-time at {outputFormat === 'mp4' ? '2 steps' : '1 step'} ·
                Keep this tab active
              </p>
            )}
          </>
        )}

        {/* ── Working: Progress UI ── */}
        {isWorking && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

            {/* Stage indicators */}
            <div style={{ display: 'flex', gap: '6px' }}>
              {[
                { id: 'rendering', label: '1 · Render Frames', color: '#e8a84c' },
                ...(outputFormat === 'mp4'
                  ? [{ id: 'converting', label: '2 · Convert MP4', color: '#4c8ee8' }]
                  : []
                ),
              ].map(s => {
                const isDone = (s.id === 'rendering' && stage === 'converting')
                const isActive = stage === s.id
                return (
                  <div
                    key={s.id}
                    style={{
                      flex: 1,
                      padding: '8px 10px',
                      borderRadius: '8px',
                      border: `1px solid ${isDone ? 'rgba(76,232,168,0.3)' : isActive ? s.color : '#272b36'}`,
                      background: isDone ? 'rgba(76,232,168,0.06)' : isActive ? `rgba(${s.color === '#e8a84c' ? '232,168,76' : '76,142,232'},0.08)` : 'transparent',
                      textAlign: 'center',
                    }}
                  >
                    <p style={{ fontSize: '11px', fontWeight: 700, color: isDone ? '#4ce8a8' : isActive ? s.color : '#3a3f4d', margin: 0 }}>
                      {isDone ? '✓ ' : isActive ? '⏳ ' : ''}{s.label}
                    </p>
                  </div>
                )
              })}
            </div>

            {/* Main progress card */}
            <div style={{ padding: '16px', background: '#1c1f27', border: '1px solid #272b36', borderRadius: '12px' }}>

              {/* Total progress bar */}
              <div style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: stage === 'converting' ? '#4c8ee8' : '#e8a84c', fontFamily: 'monospace' }}>
                    Total Progress
                  </span>
                  <span style={{ fontSize: '14px', fontWeight: 900, color: '#e8eaf0', fontFamily: 'monospace' }}>
                    {totalPct}%
                  </span>
                </div>
                <div style={{ height: '8px', background: '#272b36', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    width: `${totalPct}%`,
                    background: stage === 'converting'
                      ? 'linear-gradient(90deg, #e8a84c, #4c8ee8, #4ce8a8)'
                      : 'linear-gradient(90deg, #e8a84c, #e8764c)',
                    borderRadius: '4px',
                    transition: 'width 0.5s ease',
                  }} />
                </div>
              </div>

              {/* Sub-progress bars */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '10px' }}>
                {/* Render sub-bar */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                    <span style={{ fontSize: '10px', color: '#6b7080', fontFamily: 'monospace' }}>Render</span>
                    <span style={{ fontSize: '10px', color: '#e8a84c', fontFamily: 'monospace' }}>{Math.round(renderPct)}%</span>
                  </div>
                  <div style={{ height: '4px', background: '#272b36', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${renderPct}%`, background: '#e8a84c', borderRadius: '2px', transition: 'width 0.3s ease' }} />
                  </div>
                </div>

                {/* Convert sub-bar */}
                {outputFormat === 'mp4' && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                      <span style={{ fontSize: '10px', color: '#6b7080', fontFamily: 'monospace' }}>Convert MP4</span>
                      <span style={{ fontSize: '10px', color: '#4c8ee8', fontFamily: 'monospace' }}>{Math.round(convertPct)}%</span>
                    </div>
                    <div style={{ height: '4px', background: '#272b36', borderRadius: '2px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${convertPct}%`, background: '#4c8ee8', borderRadius: '2px', transition: 'width 0.3s ease' }} />
                    </div>
                  </div>
                )}
              </div>

              {/* Status message */}
              <div style={{ padding: '8px 10px', background: '#0c0d0f', borderRadius: '6px' }}>
                <p style={{ fontSize: '11px', fontFamily: 'monospace', color: '#6b7080', margin: 0, lineHeight: 1.5 }}>
                  {message || 'Processing...'}
                </p>
              </div>
            </div>

            {/* Keep tab active warning */}
            <div style={{ padding: '10px 14px', background: 'rgba(232,76,107,0.06)', border: '1px solid rgba(232,76,107,0.15)', borderRadius: '8px', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
              <span style={{ fontSize: '14px', flexShrink: 0 }}>⚠️</span>
              <p style={{ fontSize: '11px', color: '#e84c6b', fontFamily: 'monospace', margin: 0, lineHeight: 1.5 }}>
                Keep this tab active and your screen on. Switching tabs may pause rendering.
              </p>
            </div>
          </div>
        )}

        {/* ── Error ── */}
        {stage === 'error' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ padding: '14px', background: 'rgba(232,76,107,0.08)', border: '1px solid rgba(232,76,107,0.25)', borderRadius: '10px' }}>
              <p style={{ fontSize: '12px', fontWeight: 700, color: '#e84c6b', marginBottom: '6px' }}>
                ❌ Render Failed
              </p>
              <p style={{ fontSize: '11px', color: '#e84c6b', fontFamily: 'monospace', margin: 0, lineHeight: 1.5, opacity: 0.8 }}>
                {error}
              </p>
            </div>
            <div style={{ padding: '12px 14px', background: '#1c1f27', border: '1px solid #272b36', borderRadius: '8px', fontSize: '11px', color: '#6b7080', fontFamily: 'monospace', lineHeight: 1.6 }}>
              <p style={{ color: '#e8a84c', fontWeight: 700, marginBottom: '4px' }}>💡 Troubleshooting:</p>
              <p>• Make sure you are using Chrome</p>
              <p>• Allow microphone/camera permissions if prompted</p>
              <p>• Try a shorter video first</p>
              <p>• Try WebM format instead of MP4</p>
            </div>
            <button onClick={handleReset} style={{ width: '100%', padding: '11px', borderRadius: '8px', border: '1px solid #272b36', background: '#1c1f27', color: '#e8eaf0', fontSize: '13px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
              🔄 Try Again
            </button>
          </div>
        )}

        {/* ── Done ── */}
        {stage === 'done' && outputUrl && outputBlob && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

            {/* Success banner */}
            <div style={{ padding: '12px 14px', background: 'rgba(76,232,168,0.08)', border: '1px solid rgba(76,232,168,0.25)', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '20px' }}>✅</span>
              <div>
                <p style={{ fontSize: '13px', fontWeight: 800, color: '#4ce8a8', margin: '0 0 2px' }}>
                  Video Ready!
                </p>
                <p style={{ fontSize: '11px', color: '#6b7080', fontFamily: 'monospace', margin: 0 }}>
                  {outputBlob.type === 'video/mp4' ? '🎬 MP4' : '📹 WebM'} ·{' '}
                  {(outputBlob.size / 1024 / 1024).toFixed(1)} MB
                  {renderTime && ` · ${renderTime}s to render`}
                </p>
              </div>
            </div>

            {/* Preview player */}
            <div style={{ borderRadius: '10px', overflow: 'hidden', background: '#000', border: '1px solid #272b36' }}>
              <video
                src={outputUrl}
                controls
                playsInline
                style={{ width: '100%', display: 'block', maxHeight: '220px', objectFit: 'contain' }}
              />
            </div>

            {/* File info */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px' }}>
              {[
                { label: 'Format', value: outputBlob.type === 'video/mp4' ? 'MP4' : 'WebM' },
                { label: 'Size', value: `${(outputBlob.size / 1024 / 1024).toFixed(1)} MB` },
                { label: 'Time', value: renderTime ? `${renderTime}s` : '—' },
              ].map(item => (
                <div key={item.label} style={{ padding: '8px', background: '#1c1f27', border: '1px solid #272b36', borderRadius: '6px', textAlign: 'center' }}>
                  <p style={{ fontSize: '9px', color: '#6b7080', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 2px' }}>
                    {item.label}
                  </p>
                  <p style={{ fontSize: '13px', fontWeight: 800, color: '#e8a84c', margin: 0, fontFamily: 'monospace' }}>
                    {item.value}
                  </p>
                </div>
              ))}
            </div>

            {/* Download button */}
            <button
              onClick={handleDownload}
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: '10px',
                border: 'none',
                background: outputBlob.type === 'video/mp4'
                  ? 'linear-gradient(135deg, #4ce8a8 0%, #4c8ee8 100%)'
                  : 'linear-gradient(135deg, #4c8ee8 0%, #4ce8a8 100%)',
                color: '#000',
                fontSize: '15px',
                fontWeight: 900,
                cursor: 'pointer',
                fontFamily: 'inherit',
                letterSpacing: '0.3px',
                boxShadow: '0 4px 20px rgba(76,232,168,0.3)',
              }}
              onMouseEnter={e => ((e.currentTarget as HTMLElement).style.opacity = '0.9')}
              onMouseLeave={e => ((e.currentTarget as HTMLElement).style.opacity = '1')}
            >
              ⬇ Download {outputBlob.type === 'video/mp4' ? 'MP4' : 'WebM'}
            </button>

            {/* Action buttons row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <button
                onClick={handleReset}
                style={{ padding: '10px', borderRadius: '8px', border: '1px solid #272b36', background: '#1c1f27', color: '#6b7080', fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
              >
                🔄 Render Again
              </button>
              <button
                onClick={() => {
                  setOutputFormat(outputBlob.type === 'video/mp4' ? 'webm' : 'mp4')
                  handleReset()
                }}
                style={{ padding: '10px', borderRadius: '8px', border: '1px solid #272b36', background: '#1c1f27', color: '#6b7080', fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
              >
                {outputBlob.type === 'video/mp4' ? '⚡ Try WebM' : '🎬 Try MP4'}
              </button>
            </div>

            {/* MP4 compatibility note */}
            {outputBlob.type === 'video/mp4' && (
              <div style={{ padding: '10px 14px', background: '#1c1f27', border: '1px solid #272b36', borderRadius: '8px' }}>
                <p style={{ fontSize: '10px', color: '#6b7080', fontFamily: 'monospace', lineHeight: 1.6, margin: 0 }}>
                  <span style={{ color: '#4ce8a8', fontWeight: 700 }}>✅ MP4 works on:</span>{' '}
                  iPhone · Android · Windows · Mac · YouTube · Instagram · TikTok · WhatsApp
                </p>
              </div>
            )}

            {outputBlob.type !== 'video/mp4' && (
              <div style={{ padding: '10px 14px', background: 'rgba(232,168,76,0.05)', border: '1px solid rgba(232,168,76,0.15)', borderRadius: '8px' }}>
                <p style={{ fontSize: '10px', color: '#a87530', fontFamily: 'monospace', lineHeight: 1.6, margin: 0 }}>
                  💡 WebM works in Chrome / Firefox / Edge. To convert to MP4, click <strong>Try MP4</strong> above or use cloudconvert.com
                </p>
              </div>
            )}

          </div>
        )}

      </div>
    </div>
  )
}