'use client'

import { useRef, useState, useCallback } from 'react'
import { Subtitle, SubtitleStyle } from '@/types/subtitle'

interface SyncPlayerProps {
  videoUrl: string
  subtitles: Subtitle[]
  style: SubtitleStyle
  onSubtitlesChange: (subtitles: Subtitle[]) => void
}

function formatTime(sec: number): string {
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = Math.floor(sec % 60)
  const ms = Math.floor((sec % 1) * 1000)
  return `${pad(h)}:${pad(m)}:${pad(s)},${String(ms).padStart(3, '0')}`
}

function parseTime(str: string): number {
  const clean = str.replace(',', '.')
  const parts = clean.split(':')
  if (parts.length !== 3) return 0
  return (
    parseFloat(parts[0]) * 3600 +
    parseFloat(parts[1]) * 60 +
    parseFloat(parts[2])
  )
}

function pad(n: number) {
  return String(n).padStart(2, '0')
}

export default function SyncPlayer({
  videoUrl,
  subtitles,
  style,
  onSubtitlesChange,
}: SyncPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const timelineRef = useRef<HTMLDivElement>(null)

  const [currentTime, setCurrentTime] = useState(0)
  const [offset, setOffset] = useState(0)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editField, setEditField] = useState<'text' | 'start' | 'end' | null>(null)
  const [editValue, setEditValue] = useState('')
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [syncMode, setSyncMode] = useState<'offset' | 'individual'>('offset')
  const [showShortcuts, setShowShortcuts] = useState(false)

  const duration = subtitles[subtitles.length - 1]?.end ?? 60

  const currentSubtitle = subtitles.find(
    s =>
      currentTime >= s.start + offset &&
      currentTime <= s.end + offset + 0.3
  ) ?? null

  // ── Update a subtitle field ───────────────────────
  const updateSub = useCallback(
    (id: string, field: keyof Subtitle, value: any) => {
      onSubtitlesChange(
        subtitles.map(s => s.id === id ? { ...s, [field]: value } : s)
      )
    },
    [subtitles, onSubtitlesChange]
  )

  // ── Commit edit ───────────────────────────────────
  const commitEdit = () => {
    if (!editingId || !editField) return
    if (editField === 'text') {
      updateSub(editingId, 'text', editValue)
    } else {
      const t = parseTime(editValue)
      if (!isNaN(t) && t >= 0) updateSub(editingId, editField, t)
    }
    setEditingId(null)
    setEditField(null)
    setEditValue('')
  }

  const startEdit = (id: string, field: 'text' | 'start' | 'end', value: string | number) => {
    setEditingId(id)
    setEditField(field)
    setEditValue(
      field === 'text' ? String(value) : formatTime(Number(value))
    )
  }

  // ── Seek video ─────────────────────────────────────
  const seekTo = (t: number) => {
    if (videoRef.current) videoRef.current.currentTime = t
  }

  // ── Nudge timestamp ────────────────────────────────
  const nudge = (id: string, field: 'start' | 'end', delta: number) => {
    const sub = subtitles.find(s => s.id === id)
    if (!sub) return
    const newVal = Math.max(0, parseFloat((sub[field] + delta).toFixed(3)))
    updateSub(id, field, newVal)
  }

  // ── Apply global offset to all subtitles ──────────
  const applyOffset = () => {
    if (offset === 0) return
    onSubtitlesChange(
      subtitles.map(s => ({
        ...s,
        start: Math.max(0, parseFloat((s.start + offset).toFixed(3))),
        end: Math.max(0, parseFloat((s.end + offset).toFixed(3))),
      }))
    )
    setOffset(0)
  }

  // ── Timeline click to seek ─────────────────────────
  const handleTimelineClick = (e: React.MouseEvent) => {
    if (!timelineRef.current) return
    const rect = timelineRef.current.getBoundingClientRect()
    const pct = (e.clientX - rect.left) / rect.width
    seekTo(Math.max(0, Math.min(duration, pct * duration)))
  }

  // ── Shift all subtitles from index onward ─────────
  const shiftFrom = (index: number, delta: number) => {
    onSubtitlesChange(
      subtitles.map((s, i) =>
        i >= index
          ? {
              ...s,
              start: Math.max(0, parseFloat((s.start + delta).toFixed(3))),
              end: Math.max(0, parseFloat((s.end + delta).toFixed(3))),
            }
          : s
      )
    )
  }

  const isEmpty = subtitles.length === 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>

      {/* ── Video Player ─────────────────────────────── */}
      <div style={{ position: 'relative', background: '#000', flexShrink: 0 }}>
        <video
          ref={videoRef}
          src={videoUrl}
          controls
          playsInline
          style={{ width: '100%', display: 'block', maxHeight: '260px', objectFit: 'contain' }}
          onTimeUpdate={e => setCurrentTime(e.currentTarget.currentTime)}
        />

        {/* Subtitle overlay */}
        {currentSubtitle && (
          <div style={{
            position: 'absolute',
            left: '50%',
            transform: 'translateX(-50%)',
            width: `${style.maxWidth}%`,
            textAlign: style.textAlign,
            bottom: style.position !== 'top' ? '16px' : 'auto',
            top: style.position === 'top' ? '16px' : 'auto',
            fontFamily: style.fontFamily,
            fontSize: `${Math.min(style.fontSize, 18)}px`,
            fontWeight: style.fontWeight as any,
            color: style.color,
            backgroundColor: style.backgroundColor,
            padding: '5px 12px',
            borderRadius: '6px',
            textShadow: '0 2px 8px rgba(0,0,0,0.9)',
            pointerEvents: 'none',
            zIndex: 10,
          }}>
            {currentSubtitle.text}
          </div>
        )}

        {/* Current time badge */}
        <div style={{
          position: 'absolute',
          top: '8px',
          left: '8px',
          background: 'rgba(0,0,0,0.7)',
          color: '#e8a84c',
          fontSize: '11px',
          fontFamily: 'monospace',
          fontWeight: 700,
          padding: '3px 8px',
          borderRadius: '5px',
          pointerEvents: 'none',
        }}>
          {formatTime(currentTime)}
        </div>

        {/* Active subtitle badge */}
        {currentSubtitle && (
          <div style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            background: 'rgba(232,168,76,0.85)',
            color: '#000',
            fontSize: '10px',
            fontFamily: 'monospace',
            fontWeight: 700,
            padding: '3px 8px',
            borderRadius: '5px',
            pointerEvents: 'none',
          }}>
            #{currentSubtitle.index}
          </div>
        )}
      </div>

      {/* ── Sync Mode Tabs ────────────────────────────── */}
      <div style={{ display: 'flex', borderBottom: '1px solid #272b36', flexShrink: 0 }}>
        {([
          { id: 'offset', label: '⏱ Global Offset' },
          { id: 'individual', label: '✏️ Edit Segments' },
        ] as const).map(tab => (
          <button
            key={tab.id}
            onClick={() => setSyncMode(tab.id)}
            style={{
              flex: 1,
              padding: '10px 6px',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
              border: 'none',
              borderBottom: `2px solid ${syncMode === tab.id ? '#e8a84c' : 'transparent'}`,
              background: 'none',
              color: syncMode === tab.id ? '#e8a84c' : '#6b7080',
              fontFamily: 'inherit',
              transition: 'all 0.15s',
            }}
          >
            {tab.label}
          </button>
        ))}

        {/* Shortcuts toggle */}
        <button
          onClick={() => setShowShortcuts(p => !p)}
          title="Keyboard shortcuts"
          style={{
            padding: '10px 12px',
            border: 'none',
            background: 'none',
            color: showShortcuts ? '#e8a84c' : '#3a3f4d',
            cursor: 'pointer',
            fontSize: '14px',
            borderBottom: '2px solid transparent',
          }}
        >
          ⌨️
        </button>
      </div>

      {/* ── Keyboard Shortcuts ───────────────────────── */}
      {showShortcuts && (
        <div style={{
          padding: '10px 14px',
          background: '#1c1f27',
          borderBottom: '1px solid #272b36',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '4px',
          flexShrink: 0,
        }}>
          {[
            { key: 'Click timestamp', action: 'Edit time' },
            { key: 'Click text', action: 'Edit text' },
            { key: '▶ button', action: 'Seek to subtitle' },
            { key: '⌘+Enter', action: 'Save edit' },
            { key: '±0.1s nudge', action: 'Fine adjust' },
            { key: 'Shift from here', action: 'Move all below' },
          ].map(s => (
            <div key={s.key} style={{ fontSize: '10px', fontFamily: 'monospace' }}>
              <span style={{ color: '#e8a84c' }}>{s.key}</span>
              <span style={{ color: '#6b7080' }}> → {s.action}</span>
            </div>
          ))}
        </div>
      )}

      {/* ── Global Offset Panel ──────────────────────── */}
      {syncMode === 'offset' && (
        <div style={{ padding: '14px 16px', borderBottom: '1px solid #272b36', flexShrink: 0 }}>

          {/* Offset slider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <span style={{ fontSize: '11px', color: '#6b7080', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
              Offset
            </span>
            <input
              type="range"
              min={-10} max={10} step={0.05}
              value={offset}
              onChange={e => setOffset(Number(e.target.value))}
              style={{ flex: 1, accentColor: '#e8a84c', cursor: 'pointer' }}
            />
            <span style={{
              fontSize: '14px',
              fontWeight: 900,
              fontFamily: 'monospace',
              color: offset === 0 ? '#6b7080' : offset > 0 ? '#4ce8a8' : '#e84c6b',
              minWidth: '58px',
              textAlign: 'right',
            }}>
              {offset > 0 ? '+' : ''}{offset.toFixed(2)}s
            </span>
          </div>

          {/* Fine nudge buttons */}
          <div style={{ display: 'flex', gap: '5px', marginBottom: '10px' }}>
            {[-1, -0.5, -0.1, -0.05].map(v => (
              <button key={v} onClick={() => setOffset(o => parseFloat((o + v).toFixed(3)))} style={nudgeBtn('left')}>
                {v}s
              </button>
            ))}
            <button onClick={() => setOffset(0)} style={nudgeBtn('center')}>0</button>
            {[0.05, 0.1, 0.5, 1].map(v => (
              <button key={v} onClick={() => setOffset(o => parseFloat((o + v).toFixed(3)))} style={nudgeBtn('right')}>
                +{v}s
              </button>
            ))}
          </div>

          {/* Current subtitle info */}
          <div style={{
            padding: '10px 12px',
            background: currentSubtitle ? 'rgba(232,168,76,0.06)' : '#1c1f27',
            border: `1px solid ${currentSubtitle ? 'rgba(232,168,76,0.2)' : '#272b36'}`,
            borderRadius: '8px',
            marginBottom: '10px',
            minHeight: '44px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}>
            {currentSubtitle ? (
              <>
                <span style={{ fontSize: '10px', fontFamily: 'monospace', background: 'rgba(232,168,76,0.15)', color: '#e8a84c', padding: '2px 6px', borderRadius: '4px', flexShrink: 0 }}>
                  #{currentSubtitle.index}
                </span>
                <p style={{ fontSize: '13px', fontWeight: 600, color: '#e8a84c', margin: 0, flex: 1 }}>
                  {currentSubtitle.text}
                </p>
              </>
            ) : (
              <p style={{ fontSize: '12px', color: '#3a3f4d', fontFamily: 'monospace', margin: 0 }}>
                No subtitle at {currentTime.toFixed(2)}s
              </p>
            )}
          </div>

          {/* Apply offset button */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={applyOffset}
              disabled={offset === 0}
              style={{
                flex: 1,
                padding: '9px',
                borderRadius: '8px',
                border: 'none',
                background: offset !== 0 ? '#e8a84c' : '#1c1f27',
                color: offset !== 0 ? '#000' : '#3a3f4d',
                fontSize: '12px',
                fontWeight: 700,
                cursor: offset !== 0 ? 'pointer' : 'not-allowed',
                fontFamily: 'inherit',
              }}
            >
              ✓ Apply {offset !== 0 ? `${offset > 0 ? '+' : ''}${offset.toFixed(2)}s` : ''} to All
            </button>
            <button
              onClick={() => setOffset(0)}
              disabled={offset === 0}
              style={{
                padding: '9px 14px',
                borderRadius: '8px',
                border: '1px solid #272b36',
                background: '#1c1f27',
                color: '#6b7080',
                fontSize: '12px',
                fontWeight: 600,
                cursor: offset !== 0 ? 'pointer' : 'not-allowed',
                fontFamily: 'inherit',
                opacity: offset !== 0 ? 1 : 0.4,
              }}
            >
              Reset
            </button>
          </div>

          {offset !== 0 && (
            <p style={{ fontSize: '10px', color: '#6b7080', fontFamily: 'monospace', marginTop: '6px', lineHeight: 1.5 }}>
              Preview only. Click <strong style={{ color: '#e8a84c' }}>Apply</strong> to permanently shift all {subtitles.length} segments by {offset > 0 ? '+' : ''}{offset.toFixed(2)}s
            </p>
          )}
        </div>
      )}

      {/* ── Timeline ─────────────────────────────────── */}
      <div
        ref={timelineRef}
        onClick={handleTimelineClick}
        style={{
          position: 'relative',
          height: '36px',
          background: '#0c0d0f',
          borderBottom: '1px solid #272b36',
          cursor: 'crosshair',
          flexShrink: 0,
          overflow: 'hidden',
        }}
      >
        {/* Subtitle blocks on timeline */}
        {subtitles.map(sub => {
          const left = (sub.start / duration) * 100
          const width = Math.max(((sub.end - sub.start) / duration) * 100, 0.3)
          const isActive = currentTime >= sub.start + offset && currentTime <= sub.end + offset
          const isHovered = hoveredId === sub.id

          return (
            <div
              key={sub.id}
              onClick={e => {
                e.stopPropagation()
                seekTo(sub.start)
              }}
              onMouseEnter={() => setHoveredId(sub.id)}
              onMouseLeave={() => setHoveredId(null)}
              title={sub.text}
              style={{
                position: 'absolute',
                left: `${left}%`,
                width: `${width}%`,
                top: '4px',
                bottom: '4px',
                background: isActive
                  ? '#e8a84c'
                  : isHovered
                  ? 'rgba(232,168,76,0.6)'
                  : 'rgba(232,168,76,0.3)',
                borderRadius: '3px',
                cursor: 'pointer',
                transition: 'background 0.1s',
                border: isActive ? '1px solid #e8a84c' : '1px solid transparent',
              }}
            />
          )
        })}

        {/* Playhead */}
        <div style={{
          position: 'absolute',
          left: `${Math.min((currentTime / duration) * 100, 100)}%`,
          top: 0,
          bottom: 0,
          width: '2px',
          background: '#fff',
          borderRadius: '1px',
          pointerEvents: 'none',
          zIndex: 5,
        }} />

        {/* Time labels */}
        <div style={{ position: 'absolute', left: '4px', bottom: '3px', fontSize: '9px', color: '#3a3f4d', fontFamily: 'monospace', pointerEvents: 'none' }}>
          0:00
        </div>
        <div style={{ position: 'absolute', right: '4px', bottom: '3px', fontSize: '9px', color: '#3a3f4d', fontFamily: 'monospace', pointerEvents: 'none' }}>
          {Math.floor(duration / 60)}:{String(Math.floor(duration % 60)).padStart(2, '0')}
        </div>
      </div>

      {/* ── Individual Edit List ─────────────────────── */}
      {syncMode === 'individual' && (
        <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
          {isEmpty && (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: '#6b7080', fontSize: '13px' }}>
              <div style={{ fontSize: '32px', opacity: 0.2, marginBottom: '10px' }}>🎙️</div>
              No subtitles yet
            </div>
          )}

          {subtitles.map((sub, index) => {
            const isActive = currentTime >= sub.start + offset && currentTime <= sub.end + offset
            const isEditing = editingId === sub.id

            return (
              <div
                key={sub.id}
                style={{
                  borderBottom: '1px solid #1a1d24',
                  background: isActive ? 'rgba(232,168,76,0.05)' : 'transparent',
                  borderLeft: `3px solid ${isActive ? '#e8a84c' : 'transparent'}`,
                  transition: 'background 0.1s',
                }}
              >
                {/* Top row — timestamps + actions */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '8px 12px 4px 10px',
                  flexWrap: 'wrap',
                }}>

                  {/* Index */}
                  <span style={{
                    fontSize: '9px',
                    fontFamily: 'monospace',
                    background: isActive ? 'rgba(232,168,76,0.2)' : '#1c1f27',
                    color: isActive ? '#e8a84c' : '#6b7080',
                    padding: '1px 5px',
                    borderRadius: '3px',
                    flexShrink: 0,
                  }}>
                    {sub.index}
                  </span>

                  {/* Start time */}
                  {isEditing && editField === 'start' ? (
                    <input
                      autoFocus
                      value={editValue}
                      onChange={e => setEditValue(e.target.value)}
                      onBlur={commitEdit}
                      onKeyDown={e => {
                        if (e.key === 'Enter') commitEdit()
                        if (e.key === 'Escape') setEditingId(null)
                      }}
                      style={timeInput}
                    />
                  ) : (
                    <span
                      onClick={() => startEdit(sub.id, 'start', sub.start)}
                      style={timeTag(isActive)}
                      title="Click to edit start time"
                    >
                      {formatTime(sub.start)}
                    </span>
                  )}

                  <span style={{ color: '#3a3f4d', fontSize: '10px' }}>→</span>

                  {/* End time */}
                  {isEditing && editField === 'end' ? (
                    <input
                      autoFocus
                      value={editValue}
                      onChange={e => setEditValue(e.target.value)}
                      onBlur={commitEdit}
                      onKeyDown={e => {
                        if (e.key === 'Enter') commitEdit()
                        if (e.key === 'Escape') setEditingId(null)
                      }}
                      style={timeInput}
                    />
                  ) : (
                    <span
                      onClick={() => startEdit(sub.id, 'end', sub.end)}
                      style={timeTag(isActive)}
                      title="Click to edit end time"
                    >
                      {formatTime(sub.end)}
                    </span>
                  )}

                  {/* Duration badge */}
                  <span style={{ fontSize: '9px', fontFamily: 'monospace', color: '#3a3f4d' }}>
                    {(sub.end - sub.start).toFixed(1)}s
                  </span>

                  {/* Seek button */}
                  <button
                    onClick={() => seekTo(sub.start)}
                    title="Seek to this subtitle"
                    style={iconBtn}
                    onMouseEnter={e => (e.currentTarget.style.color = '#e8a84c')}
                    onMouseLeave={e => (e.currentTarget.style.color = '#3a3f4d')}
                  >
                    ▶
                  </button>
                </div>

                {/* Nudge buttons */}
                <div style={{
                  display: 'flex',
                  gap: '3px',
                  padding: '0 10px 4px',
                  alignItems: 'center',
                }}>
                  <span style={{ fontSize: '9px', color: '#3a3f4d', fontFamily: 'monospace', marginRight: '2px' }}>
                    Start:
                  </span>
                  {[-0.5, -0.1, -0.05].map(d => (
                    <button
                      key={`s${d}`}
                      onClick={() => nudge(sub.id, 'start', d)}
                      style={smallNudgeBtn}
                      title={`Start ${d}s`}
                    >
                      {d}s
                    </button>
                  ))}
                  {[0.05, 0.1, 0.5].map(d => (
                    <button
                      key={`s+${d}`}
                      onClick={() => nudge(sub.id, 'start', d)}
                      style={smallNudgeBtn}
                      title={`Start +${d}s`}
                    >
                      +{d}s
                    </button>
                  ))}

                  <span style={{ fontSize: '9px', color: '#3a3f4d', fontFamily: 'monospace', marginLeft: '6px', marginRight: '2px' }}>
                    End:
                  </span>
                  {[-0.1, -0.05].map(d => (
                    <button
                      key={`e${d}`}
                      onClick={() => nudge(sub.id, 'end', d)}
                      style={smallNudgeBtn}
                    >
                      {d}s
                    </button>
                  ))}
                  {[0.05, 0.1].map(d => (
                    <button
                      key={`e+${d}`}
                      onClick={() => nudge(sub.id, 'end', d)}
                      style={smallNudgeBtn}
                    >
                      +{d}s
                    </button>
                  ))}
                </div>

                {/* Shift from here */}
                <div style={{
                  display: 'flex',
                  gap: '3px',
                  padding: '0 10px 6px',
                  alignItems: 'center',
                }}>
                  <span style={{ fontSize: '9px', color: '#3a3f4d', fontFamily: 'monospace', marginRight: '2px' }}>
                    Shift from #{sub.index}:
                  </span>
                  {[-1, -0.5, -0.1].map(d => (
                    <button
                      key={`sf${d}`}
                      onClick={() => shiftFrom(index, d)}
                      style={shiftBtn}
                      title={`Shift this and all below by ${d}s`}
                    >
                      {d}s
                    </button>
                  ))}
                  {[0.1, 0.5, 1].map(d => (
                    <button
                      key={`sf+${d}`}
                      onClick={() => shiftFrom(index, d)}
                      style={shiftBtn}
                      title={`Shift this and all below by +${d}s`}
                    >
                      +{d}s
                    </button>
                  ))}
                </div>

                {/* Text row */}
                <div style={{ padding: '0 10px 10px' }}>
                  {isEditing && editField === 'text' ? (
                    <div>
                      <textarea
                        autoFocus
                        value={editValue}
                        onChange={e => setEditValue(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Escape') setEditingId(null)
                          if (e.key === 'Enter' && e.metaKey) commitEdit()
                        }}
                        rows={2}
                        style={{
                          width: '100%',
                          background: 'rgba(76,142,232,0.08)',
                          border: '1px solid #4c8ee8',
                          borderRadius: '6px',
                          color: '#e8eaf0',
                          fontSize: '13px',
                          lineHeight: 1.5,
                          fontFamily: 'inherit',
                          resize: 'vertical',
                          outline: 'none',
                          padding: '6px 8px',
                          boxSizing: 'border-box',
                        }}
                      />
                      <div style={{ display: 'flex', gap: '6px', marginTop: '5px' }}>
                        <button onClick={commitEdit} style={saveBtn}>✓ Save</button>
                        <button onClick={() => setEditingId(null)} style={cancelBtn}>Cancel</button>
                        <span style={{ fontSize: '10px', color: '#3a3f4d', fontFamily: 'monospace', alignSelf: 'center' }}>
                          ⌘↵ to save
                        </span>
                      </div>
                    </div>
                  ) : (
                    <p
                      onClick={() => startEdit(sub.id, 'text', sub.text)}
                      title="Click to edit text"
                      style={{
                        fontSize: '13px',
                        fontWeight: 500,
                        lineHeight: 1.5,
                        color: isActive ? '#fff' : '#c8cad0',
                        cursor: 'text',
                        margin: 0,
                        padding: '4px 6px',
                        borderRadius: '5px',
                        wordBreak: 'break-word',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '6px',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <span style={{ flex: 1 }}>{sub.text}</span>
                      <span style={{ fontSize: '10px', color: '#3a3f4d', flexShrink: 0, marginTop: '2px' }}>✎</span>
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Offset mode subtitle list ─────────────────── */}
      {syncMode === 'offset' && (
        <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
          {subtitles.map(sub => {
            const isActive = currentTime >= sub.start + offset && currentTime <= sub.end + offset
            return (
              <div
                key={sub.id}
                onClick={() => seekTo(sub.start)}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px',
                  padding: '8px 12px',
                  borderBottom: '1px solid #1a1d24',
                  background: isActive ? 'rgba(232,168,76,0.05)' : 'transparent',
                  borderLeft: `3px solid ${isActive ? '#e8a84c' : 'transparent'}`,
                  cursor: 'pointer',
                  transition: 'background 0.1s',
                }}
                onMouseEnter={e => !isActive && (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                onMouseLeave={e => !isActive && (e.currentTarget.style.background = 'transparent')}
              >
                <span style={{
                  fontSize: '9px',
                  fontFamily: 'monospace',
                  background: isActive ? 'rgba(232,168,76,0.2)' : '#1c1f27',
                  color: isActive ? '#e8a84c' : '#6b7080',
                  padding: '2px 5px',
                  borderRadius: '3px',
                  flexShrink: 0,
                  marginTop: '2px',
                }}>
                  {sub.index}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '10px', fontFamily: 'monospace', color: isActive ? '#e8a84c' : '#6b7080', marginBottom: '2px' }}>
                    {formatTime(sub.start + offset)} → {formatTime(sub.end + offset)}
                    {offset !== 0 && (
                      <span style={{ color: offset > 0 ? '#4ce8a8' : '#e84c6b', marginLeft: '6px', fontSize: '9px' }}>
                        ({offset > 0 ? '+' : ''}{offset.toFixed(2)}s)
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: '13px', color: isActive ? '#fff' : '#c8cad0', margin: 0, lineHeight: 1.4, wordBreak: 'break-word' }}>
                    {sub.text}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Style helpers ─────────────────────────────────────

const timeInput: React.CSSProperties = {
  fontSize: '10px',
  fontFamily: 'monospace',
  background: 'rgba(76,142,232,0.15)',
  border: '1px solid #4c8ee8',
  borderRadius: '4px',
  color: '#4c8ee8',
  padding: '2px 5px',
  width: '108px',
  outline: 'none',
}

function timeTag(isActive: boolean): React.CSSProperties {
  return {
    fontSize: '10px',
    fontFamily: 'monospace',
    color: isActive ? '#e8a84c' : '#6b7080',
    cursor: 'pointer',
    padding: '2px 4px',
    borderRadius: '3px',
    transition: 'background 0.1s',
  }
}

const iconBtn: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: '#3a3f4d',
  cursor: 'pointer',
  fontSize: '11px',
  padding: '2px 5px',
  borderRadius: '3px',
  fontFamily: 'inherit',
  marginLeft: 'auto',
  transition: 'color 0.1s',
}

const smallNudgeBtn: React.CSSProperties = {
  padding: '2px 5px',
  borderRadius: '4px',
  border: '1px solid #272b36',
  background: '#1c1f27',
  color: '#6b7080',
  fontSize: '9px',
  cursor: 'pointer',
  fontFamily: 'monospace',
  transition: 'all 0.1s',
}

const shiftBtn: React.CSSProperties = {
  padding: '2px 5px',
  borderRadius: '4px',
  border: '1px solid rgba(76,142,232,0.3)',
  background: 'rgba(76,142,232,0.06)',
  color: '#4c8ee8',
  fontSize: '9px',
  cursor: 'pointer',
  fontFamily: 'monospace',
}

function nudgeBtn(dir: 'left' | 'right' | 'center'): React.CSSProperties {
  return {
    flex: 1,
    padding: '5px 2px',
    borderRadius: '5px',
    border: `1px solid ${dir === 'center' ? '#272b36' : dir === 'right' ? 'rgba(76,232,168,0.3)' : 'rgba(232,76,107,0.3)'}`,
    background: dir === 'center' ? '#1c1f27' : dir === 'right' ? 'rgba(76,232,168,0.06)' : 'rgba(232,76,107,0.06)',
    color: dir === 'center' ? '#6b7080' : dir === 'right' ? '#4ce8a8' : '#e84c6b',
    fontSize: '10px',
    cursor: 'pointer',
    fontFamily: 'monospace',
    fontWeight: 600,
    textAlign: 'center' as const,
  }
}

const saveBtn: React.CSSProperties = {
  padding: '4px 12px',
  background: '#e8a84c',
  color: '#000',
  border: 'none',
  borderRadius: '5px',
  fontSize: '11px',
  fontWeight: 700,
  cursor: 'pointer',
  fontFamily: 'inherit',
}

const cancelBtn: React.CSSProperties = {
  padding: '4px 12px',
  background: 'none',
  color: '#6b7080',
  border: '1px solid #272b36',
  borderRadius: '5px',
  fontSize: '11px',
  fontWeight: 600,
  cursor: 'pointer',
  fontFamily: 'inherit',
}