'use client'

import LanguageSelector from '@/components/LanguageSelector'

interface ControlBarProps {
  isRecording: boolean
  hasSubtitles: boolean
  status: string
  language: string
  wordsPerSegment: number
  pacingGap: number
  onStart: () => void
  onStop: () => void
  onClear: () => void
  onNewFile: () => void
  onLanguageChange: (code: string) => void
  onWordsPerSegmentChange: (n: number) => void
  onPacingGapChange: (n: number) => void
}

export default function ControlBar({
  isRecording, hasSubtitles, status, language,
  wordsPerSegment, pacingGap,
  onStart, onStop, onClear, onNewFile,
  onLanguageChange, onWordsPerSegmentChange, onPacingGapChange,
}: ControlBarProps) {

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>

      {/* Chrome warning */}
      {typeof window !== 'undefined' && !navigator.userAgent.includes('Chrome') && (
        <div style={{ padding: '8px 12px', background: 'rgba(232,76,107,0.08)', border: '1px solid rgba(232,76,107,0.2)', borderRadius: '8px', fontSize: '11px', color: '#e84c6b', fontFamily: 'monospace' }}>
          ⚠️ Speech recognition requires <strong>Google Chrome</strong>.
        </div>
      )}

      {/* Row 1 — Main buttons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        <button
          onClick={onStart} disabled={isRecording}
          style={{
            padding: '9px 16px',
            background: isRecording ? 'rgba(232,76,107,0.15)' : '#e8a84c',
            color: isRecording ? '#e84c6b' : '#000',
            border: isRecording ? '1px solid #e84c6b' : 'none',
            borderRadius: '8px', fontWeight: 700, fontSize: '13px',
            cursor: isRecording ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
            animation: isRecording ? 'pulse 1.5s infinite' : 'none',
          }}
        >
          {isRecording ? '🔴 Recording...' : '⏺ Start Subtitling'}
        </button>

        <button
          onClick={onStop} disabled={!isRecording}
          style={{
            padding: '9px 16px', background: 'rgba(232,76,107,0.1)',
            color: '#e84c6b', border: '1px solid #e84c6b', borderRadius: '8px',
            fontWeight: 700, fontSize: '13px',
            cursor: !isRecording ? 'not-allowed' : 'pointer',
            opacity: !isRecording ? 0.4 : 1, fontFamily: 'inherit',
          }}
        >
          ⏹ Stop
        </button>

        {hasSubtitles && (
          <button onClick={onClear} style={{ padding: '9px 16px', background: '#1c1f27', color: '#e8eaf0', border: '1px solid #272b36', borderRadius: '8px', fontWeight: 700, fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' }}>
            🗑 Clear
          </button>
        )}

        <span style={{
          padding: '4px 12px', borderRadius: '99px', fontSize: '11px', fontFamily: 'monospace',
          background: isRecording ? 'rgba(232,76,107,0.1)' : 'rgba(255,255,255,0.05)',
          color: isRecording ? '#e84c6b' : '#6b7080',
          border: `1px solid ${isRecording ? 'rgba(232,76,107,0.3)' : '#272b36'}`,
        }}>
          {status}
        </span>

        <button onClick={onNewFile} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#6b7080', fontSize: '12px', cursor: 'pointer', textDecoration: 'underline', fontFamily: 'inherit' }}>
          ← New file
        </button>
      </div>

      {/* Row 2 — Language */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span style={{ fontSize: '11px', color: '#6b7080', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
          🌍 Language:
        </span>
        <LanguageSelector selected={language} onChange={onLanguageChange} disabled={isRecording} />
        {isRecording && (
          <span style={{ fontSize: '11px', color: '#6b7080', fontFamily: 'monospace' }}>
            (stop to change)
          </span>
        )}
      </div>

      {/* Row 3 — Words per segment + Pacing */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px',
        padding: '12px 14px',
        background: '#1c1f27',
        border: '1px solid #272b36',
        borderRadius: '10px',
      }}>

        {/* Words per segment */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', color: '#6b7080', fontFamily: 'monospace' }}>
              📝 Words/Segment
            </span>
            <span style={{
              fontSize: '13px', fontWeight: 800, color: '#e8a84c',
              background: 'rgba(232,168,76,0.1)', padding: '1px 8px',
              borderRadius: '5px', fontFamily: 'monospace',
            }}>
              {wordsPerSegment}
            </span>
          </div>
          <input
            type="range" min={1} max={100} step={1}
            value={wordsPerSegment}
            disabled={isRecording}
            onChange={(e) => onWordsPerSegmentChange(Number(e.target.value))}
            style={{ width: '100%', accentColor: '#e8a84c', cursor: isRecording ? 'not-allowed' : 'pointer' }}
          />
          {/* Quick preset buttons */}
          <div style={{ display: 'flex', gap: '4px' }}>
            {[1, 3, 5, 8, 15].map(n => (
              <button
                key={n}
                onClick={() => !isRecording && onWordsPerSegmentChange(n)}
                disabled={isRecording}
                style={{
                  flex: 1, padding: '3px 0', borderRadius: '4px', fontSize: '10px',
                  fontWeight: wordsPerSegment === n ? 700 : 400,
                  border: `1px solid ${wordsPerSegment === n ? '#e8a84c' : '#272b36'}`,
                  background: wordsPerSegment === n ? 'rgba(232,168,76,0.15)' : '#13151a',
                  color: wordsPerSegment === n ? '#e8a84c' : '#6b7080',
                  cursor: isRecording ? 'not-allowed' : 'pointer',
                  fontFamily: 'monospace',
                  opacity: isRecording ? 0.5 : 1,
                }}
              >
                {n}
              </button>
            ))}
          </div>
          <p style={{ fontSize: '9px', color: '#3a3f4d', fontFamily: 'monospace', lineHeight: 1.4 }}>
            {wordsPerSegment === 1 ? '⚡ Word by word' :
             wordsPerSegment <= 3 ? '🎯 Very short' :
             wordsPerSegment <= 8 ? '✅ One liner' :
             wordsPerSegment <= 20 ? '📝 Short sentence' :
             '📄 Long block'}
          </p>
        </div>

        {/* Pacing gap */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', color: '#6b7080', fontFamily: 'monospace' }}>
              ⏱ Pacing Gap
            </span>
            <span style={{
              fontSize: '13px', fontWeight: 800, color: '#4c8ee8',
              background: 'rgba(76,142,232,0.1)', padding: '1px 8px',
              borderRadius: '5px', fontFamily: 'monospace',
            }}>
              {pacingGap.toFixed(2)}s
            </span>
          </div>
          <input
            type="range" min={0} max={1} step={0.05}
            value={pacingGap}
            disabled={isRecording}
            onChange={(e) => onPacingGapChange(Number(e.target.value))}
            style={{ width: '100%', accentColor: '#4c8ee8', cursor: isRecording ? 'not-allowed' : 'pointer' }}
          />
          {/* Quick preset buttons */}
          <div style={{ display: 'flex', gap: '4px' }}>
            {[0, 0.1, 0.2, 0.5].map(n => (
              <button
                key={n}
                onClick={() => !isRecording && onPacingGapChange(n)}
                disabled={isRecording}
                style={{
                  flex: 1, padding: '3px 0', borderRadius: '4px', fontSize: '10px',
                  fontWeight: pacingGap === n ? 700 : 400,
                  border: `1px solid ${pacingGap === n ? '#4c8ee8' : '#272b36'}`,
                  background: pacingGap === n ? 'rgba(76,142,232,0.15)' : '#13151a',
                  color: pacingGap === n ? '#4c8ee8' : '#6b7080',
                  cursor: isRecording ? 'not-allowed' : 'pointer',
                  fontFamily: 'monospace',
                  opacity: isRecording ? 0.5 : 1,
                }}
              >
                {n}s
              </button>
            ))}
          </div>
          <p style={{ fontSize: '9px', color: '#3a3f4d', fontFamily: 'monospace', lineHeight: 1.4 }}>
            {pacingGap === 0 ? '⚡ No gap' :
             pacingGap <= 0.1 ? '🎯 Tight' :
             pacingGap <= 0.3 ? '✅ Natural' :
             '🐌 Spaced out'}
          </p>
        </div>

      </div>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.6} }
      `}</style>
    </div>
  )
}