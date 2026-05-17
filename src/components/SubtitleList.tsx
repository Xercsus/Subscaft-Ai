'use client'

import { useState, useEffect, useRef } from 'react'
import { Subtitle } from '@/types/subtitle'

interface SubtitleListProps {
  subtitles: Subtitle[]
  currentTime: number
  interimText: string
  isRecording: boolean
  onEdit: (id: string, field: 'text' | 'start' | 'end', value: string | number) => void
  onDelete: (id: string) => void
  onSeek: (time: number) => void
  onAdd: (subtitle: Subtitle) => void
  onReorder: (subtitles: Subtitle[]) => void
  onMerge: (id1: string, id2: string) => void
  onSplit: (id: string, splitText1: string, splitText2: string) => void
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
  return parseFloat(parts[0]) * 3600 + parseFloat(parts[1]) * 60 + parseFloat(parts[2])
}

function pad(n: number) { return String(n).padStart(2, '0') }

export default function SubtitleList({
  subtitles,
  currentTime,
  interimText,
  isRecording,
  onEdit,
  onDelete,
  onSeek,
  onAdd,
  onReorder,
  onMerge,
  onSplit,
}: SubtitleListProps) {
  const [editing, setEditing] = useState<{ id: string; field: 'text' | 'start' | 'end' } | null>(null)
  const [editValue, setEditValue] = useState('')
  const [splitMode, setSplitMode] = useState<string | null>(null)
  const [splitText1, setSplitText1] = useState('')
  const [splitText2, setSplitText2] = useState('')
  const [dots, setDots] = useState('.')
  const [dragOver, setDragOver] = useState<string | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const listRef = useRef<HTMLDivElement>(null)
  const dragItem = useRef<string | null>(null)

  useEffect(() => {
    if (!isRecording) return
    const interval = setInterval(() => {
      setDots(d => d.length >= 3 ? '.' : d + '.')
    }, 400)
    return () => clearInterval(interval)
  }, [isRecording])

  useEffect(() => {
    if (listRef.current && isRecording) {
      listRef.current.scrollTop = listRef.current.scrollHeight
    }
  }, [subtitles.length, isRecording])

  const startEdit = (id: string, field: 'text' | 'start' | 'end', value: string | number) => {
    setEditing({ id, field })
    setEditValue(field === 'text' ? String(value) : formatTime(Number(value)))
  }

  const commitEdit = () => {
    if (!editing) return
    if (editing.field === 'text') {
      onEdit(editing.id, 'text', editValue)
    } else {
      const t = parseTime(editValue)
      if (!isNaN(t) && t >= 0) onEdit(editing.id, editing.field, t)
    }
    setEditing(null)
  }

  const handleAddSegment = (afterIndex: number) => {
    const prev = subtitles[afterIndex]
    const next = subtitles[afterIndex + 1]
    const start = prev ? prev.end + 0.1 : 0
    const end = next ? Math.min(next.start - 0.1, start + 2) : start + 2
    const newSub: Subtitle = {
      id: crypto.randomUUID(),
      index: afterIndex + 2,
      start: parseFloat(start.toFixed(3)),
      end: parseFloat(end.toFixed(3)),
      text: 'New subtitle',
    }
    onAdd(newSub)
    // Auto-open edit for new segment
    setTimeout(() => startEdit(newSub.id, 'text', newSub.text), 100)
  }

  const handleAddAtStart = () => {
    const first = subtitles[0]
    const newSub: Subtitle = {
      id: crypto.randomUUID(),
      index: 1,
      start: 0,
      end: first ? Math.max(first.start - 0.1, 1) : 2,
      text: 'New subtitle',
    }
    onAdd(newSub)
    setTimeout(() => startEdit(newSub.id, 'text', newSub.text), 100)
  }

  const handleSplitStart = (sub: Subtitle) => {
    setSplitMode(sub.id)
    const words = sub.text.split(' ')
    const mid = Math.ceil(words.length / 2)
    setSplitText1(words.slice(0, mid).join(' '))
    setSplitText2(words.slice(mid).join(' '))
  }

  const handleSplitCommit = (id: string) => {
    if (splitText1.trim() && splitText2.trim()) {
      onSplit(id, splitText1.trim(), splitText2.trim())
    }
    setSplitMode(null)
  }

  const toggleSelect = (id: string, e: React.MouseEvent) => {
    if (!e.shiftKey && !e.metaKey) return
    e.preventDefault()
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const handleMergeSelected = () => {
    const ids = Array.from(selected)
    if (ids.length !== 2) return
    onMerge(ids[0], ids[1])
    setSelected(new Set())
  }

  // Drag to reorder
  const handleDragStart = (id: string) => { dragItem.current = id }
  const handleDragEnter = (id: string) => { setDragOver(id) }
  const handleDragEnd = () => {
    if (!dragItem.current || !dragOver || dragItem.current === dragOver) {
      setDragOver(null)
      dragItem.current = null
      return
    }
    const from = subtitles.findIndex(s => s.id === dragItem.current)
    const to = subtitles.findIndex(s => s.id === dragOver)
    if (from === -1 || to === -1) return
    const reordered = [...subtitles]
    const [moved] = reordered.splice(from, 1)
    reordered.splice(to, 0, moved)
    onReorder(reordered.map((s, i) => ({ ...s, index: i + 1 })))
    setDragOver(null)
    dragItem.current = null
  }

  if (subtitles.length === 0 && !interimText) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', color: '#6b7080', padding: '32px 20px', textAlign: 'center' }}>
        <div style={{ fontSize: '40px', opacity: 0.2 }}>🎙️</div>
        <p style={{ fontSize: '13px', lineHeight: 1.7 }}>
          Press <strong style={{ color: '#e8eaf0' }}>Start Subtitling</strong><br />to generate live captions
        </p>
        <button
          onClick={handleAddAtStart}
          style={{
            padding: '8px 16px',
            background: 'rgba(232,168,76,0.1)',
            border: '1px dashed rgba(232,168,76,0.4)',
            borderRadius: '8px',
            color: '#e8a84c',
            fontSize: '12px',
            fontWeight: 700,
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          + Add Subtitle Manually
        </button>
      </div>
    )
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* Toolbar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '8px 10px',
        borderBottom: '1px solid #272b36',
        flexShrink: 0,
        flexWrap: 'wrap',
      }}>

        {/* Add at start */}
        <button
          onClick={handleAddAtStart}
          title="Add segment at start"
          style={toolBtn('#e8a84c')}
        >
          + Add
        </button>

        {/* Merge selected */}
        <button
          onClick={handleMergeSelected}
          disabled={selected.size !== 2}
          title="Select 2 segments (⌘+click) then merge"
          style={toolBtn('#4c8ee8', selected.size !== 2)}
        >
          ⊕ Merge {selected.size === 2 ? '(2)' : ''}
        </button>

        {/* Clear selection */}
        {selected.size > 0 && (
          <button
            onClick={() => setSelected(new Set())}
            style={toolBtn('#6b7080')}
          >
            ✕ Deselect
          </button>
        )}

        <span style={{ marginLeft: 'auto', fontSize: '10px', color: '#3a3f4d', fontFamily: 'monospace' }}>
          ⌘+click to select · drag to reorder
        </span>
      </div>

      {/* List */}
      <div ref={listRef} style={{ flex: 1, overflowY: 'auto', padding: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>

        {subtitles.map((sub, index) => {
          const isActive = currentTime >= sub.start && currentTime <= sub.end + 0.3
          const isSelected = selected.has(sub.id)
          const isDragTarget = dragOver === sub.id
          const isEditingThis = editing?.id === sub.id
          const isSplitting = splitMode === sub.id

          return (
            <div key={sub.id}>
              {/* Insert button above first */}
              {index === 0 && (
                <InsertButton onClick={handleAddAtStart} />
              )}

              {/* Segment card */}
              <div
                draggable
                onDragStart={() => handleDragStart(sub.id)}
                onDragEnter={() => handleDragEnter(sub.id)}
                onDragEnd={handleDragEnd}
                onDragOver={(e) => e.preventDefault()}
                onClick={(e) => toggleSelect(sub.id, e)}
                style={{
                  background: isSelected
                    ? 'rgba(76,142,232,0.1)'
                    : isActive
                    ? 'rgba(232,168,76,0.08)'
                    : '#1c1f27',
                  border: `1px solid ${
                    isSelected ? '#4c8ee8'
                    : isDragTarget ? '#e8a84c'
                    : isActive ? '#e8a84c'
                    : '#272b36'
                  }`,
                  borderRadius: '8px',
                  overflow: 'hidden',
                  transition: 'all 0.1s',
                  cursor: 'grab',
                  position: 'relative',
                  opacity: isDragTarget ? 0.5 : 1,
                }}
              >
                {/* Active bar */}
                {isActive && (
                  <div style={{
                    position: 'absolute', left: 0, top: 0, bottom: 0,
                    width: '3px', background: '#e8a84c', borderRadius: '3px 0 0 3px',
                  }} />
                )}

                {/* Selected bar */}
                {isSelected && (
                  <div style={{
                    position: 'absolute', left: 0, top: 0, bottom: 0,
                    width: '3px', background: '#4c8ee8', borderRadius: '3px 0 0 3px',
                  }} />
                )}

                {/* Header row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '7px 10px 0 13px' }}>

                  {/* Drag handle */}
                  <span style={{ color: '#3a3f4d', fontSize: '12px', cursor: 'grab', flexShrink: 0, marginRight: '2px' }}>
                    ⠿
                  </span>

                  {/* Index */}
                  <span style={{
                    fontSize: '9px', fontFamily: 'monospace',
                    background: isActive ? 'rgba(232,168,76,0.2)' : '#272b36',
                    color: isActive ? '#e8a84c' : '#6b7080',
                    padding: '1px 5px', borderRadius: '3px', flexShrink: 0,
                  }}>
                    {sub.index}
                  </span>

                  {/* Start time */}
                  <TimeField
                    value={sub.start}
                    isEditing={isEditingThis && editing?.field === 'start'}
                    editValue={editing?.field === 'start' ? editValue : ''}
                    onStartEdit={() => startEdit(sub.id, 'start', sub.start)}
                    onChange={setEditValue}
                    onCommit={commitEdit}
                    onCancel={() => setEditing(null)}
                    isActive={isActive}
                  />

                  <span style={{ color: '#3a3f4d', fontSize: '10px' }}>→</span>

                  {/* End time */}
                  <TimeField
                    value={sub.end}
                    isEditing={isEditingThis && editing?.field === 'end'}
                    editValue={editing?.field === 'end' ? editValue : ''}
                    onStartEdit={() => startEdit(sub.id, 'end', sub.end)}
                    onChange={setEditValue}
                    onCommit={commitEdit}
                    onCancel={() => setEditing(null)}
                    isActive={isActive}
                  />

                  {/* Duration badge */}
                  <span style={{
                    fontSize: '9px', fontFamily: 'monospace',
                    color: '#3a3f4d', marginLeft: '2px',
                  }}>
                    {(sub.end - sub.start).toFixed(1)}s
                  </span>

                  {/* Action buttons */}
                  <div style={{ marginLeft: 'auto', display: 'flex', gap: '2px' }}>
                    <ActionBtn title="Seek to this subtitle" onClick={() => onSeek(sub.start)} icon="▶" color="#6b7080" hoverColor="#e8a84c" />
                    <ActionBtn title="Split segment" onClick={() => handleSplitStart(sub)} icon="✂" color="#6b7080" hoverColor="#4ce8a8" />
                    <ActionBtn title="Delete segment" onClick={() => onDelete(sub.id)} icon="✕" color="#6b7080" hoverColor="#e84c6b" />
                  </div>
                </div>

                {/* Text area */}
                <div style={{ padding: '5px 10px 8px 13px' }}>
                  {isEditingThis && editing?.field === 'text' ? (
                    <div>
                      <textarea
                        value={editValue}
                        autoFocus
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Escape') setEditing(null)
                          if (e.key === 'Enter' && e.metaKey) commitEdit()
                        }}
                        rows={2}
                        style={{
                          width: '100%', background: 'rgba(76,142,232,0.08)',
                          border: '1px solid #4c8ee8', borderRadius: '6px',
                          color: '#e8eaf0', fontSize: '13px', fontWeight: 500,
                          lineHeight: 1.5, fontFamily: 'inherit', resize: 'vertical',
                          outline: 'none', padding: '6px 8px',
                        }}
                      />
                      <div style={{ display: 'flex', gap: '6px', marginTop: '5px' }}>
                        <button onClick={commitEdit} style={saveBtn}>✓ Save</button>
                        <button onClick={() => setEditing(null)} style={cancelBtn}>Cancel</button>
                        <span style={{ fontSize: '10px', color: '#3a3f4d', fontFamily: 'monospace', alignSelf: 'center' }}>⌘↵ to save</span>
                      </div>
                    </div>
                  ) : isSplitting ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <p style={{ fontSize: '10px', color: '#4ce8a8', fontFamily: 'monospace', margin: 0 }}>✂ Split into 2 segments:</p>
                      <input
                        value={splitText1}
                        onChange={(e) => setSplitText1(e.target.value)}
                        placeholder="First part..."
                        style={splitInput}
                      />
                      <input
                        value={splitText2}
                        onChange={(e) => setSplitText2(e.target.value)}
                        placeholder="Second part..."
                        style={splitInput}
                      />
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button onClick={() => handleSplitCommit(sub.id)} style={saveBtn}>✂ Split</button>
                        <button onClick={() => setSplitMode(null)} style={cancelBtn}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <p
                      onClick={() => startEdit(sub.id, 'text', sub.text)}
                      title="Click to edit text"
                      style={{
                        fontSize: '13px', fontWeight: 500, lineHeight: 1.5,
                        color: isActive ? '#fff' : '#c8cad0',
                        cursor: 'text', margin: 0, padding: '3px 5px',
                        borderRadius: '4px', wordBreak: 'break-word',
                        transition: 'background 0.1s',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      {sub.text}
                      <span style={{ fontSize: '10px', color: '#3a3f4d', marginLeft: '5px' }}>✎</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Insert button between segments */}
              <InsertButton onClick={() => handleAddSegment(index)} />
            </div>
          )
        })}

        {/* Live interim */}
        {interimText && (
          <div style={{
            background: 'rgba(232,168,76,0.04)',
            border: '1px dashed rgba(232,168,76,0.25)',
            borderRadius: '8px', padding: '8px 12px',
            animation: 'fadeIn 0.2s ease',
          }}>
            <div style={{ fontSize: '9px', fontFamily: 'monospace', color: '#6b7080', marginBottom: '3px' }}>
              🔴 LIVE{dots}
            </div>
            <p style={{ fontSize: '13px', color: '#a87530', fontStyle: 'italic', margin: 0 }}>
              {interimText}
            </p>
          </div>
        )}

        {isRecording && !interimText && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', color: '#6b7080', fontSize: '11px', fontFamily: 'monospace' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#e84c6b', animation: 'blink 1s infinite', flexShrink: 0, display: 'inline-block' }} />
            Listening{dots}
          </div>
        )}

        <style>{`
          @keyframes fadeIn { from { opacity:0; transform:translateY(4px); } to { opacity:1; transform:none; } }
          @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.2} }
        `}</style>
      </div>
    </div>
  )
}

// ── Sub-components ────────────────────────────────────

function InsertButton({ onClick }: { onClick: () => void }) {
  const [hover, setHover] = useState(false)
  return (
    <div
      style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '2px 0', cursor: 'pointer', opacity: hover ? 1 : 0, transition: 'opacity 0.15s' }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={onClick}
    >
      <div style={{ flex: 1, height: '1px', background: 'rgba(232,168,76,0.3)' }} />
      <span style={{ fontSize: '11px', color: '#e8a84c', fontWeight: 700, background: 'rgba(232,168,76,0.1)', border: '1px solid rgba(232,168,76,0.3)', padding: '1px 8px', borderRadius: '99px', whiteSpace: 'nowrap' }}>
        + Insert
      </span>
      <div style={{ flex: 1, height: '1px', background: 'rgba(232,168,76,0.3)' }} />
    </div>
  )
}

function TimeField({ value, isEditing, editValue, onStartEdit, onChange, onCommit, onCancel, isActive }: {
  value: number; isEditing: boolean; editValue: string
  onStartEdit: () => void; onChange: (v: string) => void
  onCommit: () => void; onCancel: () => void; isActive: boolean
}) {
  if (isEditing) {
    return (
      <input
        autoFocus
        value={editValue}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onCommit}
        onKeyDown={(e) => { if (e.key === 'Enter') onCommit(); if (e.key === 'Escape') onCancel() }}
        style={{ fontSize: '10px', fontFamily: 'monospace', background: 'rgba(76,142,232,0.15)', border: '1px solid #4c8ee8', borderRadius: '4px', color: '#4c8ee8', padding: '2px 5px', width: '105px', outline: 'none' }}
      />
    )
  }
  return (
    <span
      onClick={onStartEdit}
      title="Click to edit time"
      style={{ fontSize: '10px', fontFamily: 'monospace', color: isActive ? '#e8a84c' : '#6b7080', cursor: 'pointer', padding: '2px 4px', borderRadius: '3px' }}
      onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
    >
      {formatTime(value)}
    </span>
  )
}

function ActionBtn({ title, onClick, icon, color, hoverColor }: {
  title: string; onClick: () => void; icon: string; color: string; hoverColor: string
}) {
  const [hover, setHover] = useState(false)
  return (
    <button
      title={title}
      onClick={(e) => { e.stopPropagation(); onClick() }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: 'none', border: 'none',
        color: hover ? hoverColor : color,
        cursor: 'pointer', fontSize: '12px',
        padding: '3px 5px', borderRadius: '3px',
        transition: 'color 0.1s', fontFamily: 'inherit',
      }}
    >
      {icon}
    </button>
  )
}

// Styles
const saveBtn: React.CSSProperties = { padding: '4px 12px', background: '#e8a84c', color: '#000', border: 'none', borderRadius: '5px', fontSize: '11px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }
const cancelBtn: React.CSSProperties = { padding: '4px 12px', background: 'none', color: '#6b7080', border: '1px solid #272b36', borderRadius: '5px', fontSize: '11px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }
const splitInput: React.CSSProperties = { width: '100%', padding: '5px 8px', background: '#13151a', border: '1px solid #272b36', borderRadius: '5px', color: '#e8eaf0', fontSize: '12px', fontFamily: 'inherit', outline: 'none' }
function toolBtn(color: string, disabled = false): React.CSSProperties {
  return {
    padding: '5px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 700,
    cursor: disabled ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
    border: `1px solid ${disabled ? '#272b36' : color}`,
    background: disabled ? 'none' : `rgba(${color === '#e8a84c' ? '232,168,76' : color === '#4c8ee8' ? '76,142,232' : '107,112,128'},0.1)`,
    color: disabled ? '#3a3f4d' : color,
    opacity: disabled ? 0.5 : 1,
    whiteSpace: 'nowrap' as const,
  }
}