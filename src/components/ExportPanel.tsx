'use client'

import { useState } from 'react'
import { Subtitle } from '@/types/subtitle'
import { exportSubtitles, generateSRT, generateVTT, generateTXT } from '@/lib/exportUtils'

interface ExportPanelProps {
  subtitles: Subtitle[]
  videoFileName?: string
}

export default function ExportPanel({ subtitles, videoFileName }: ExportPanelProps) {
  const [copied, setCopied] = useState<string | null>(null)
  const [preview, setPreview] = useState<'srt' | 'vtt' | 'txt' | null>(null)
  const baseName = videoFileName ? videoFileName.replace(/\.[^/.]+$/, '') : 'subtitles'
  const hasSubtitles = subtitles.length > 0

  const handleCopy = (format: 'srt' | 'vtt' | 'txt') => {
    let content = ''
    if (format === 'srt') content = generateSRT(subtitles)
    if (format === 'vtt') content = generateVTT(subtitles)
    if (format === 'txt') content = generateTXT(subtitles)
    navigator.clipboard.writeText(content)
    setCopied(format)
    setTimeout(() => setCopied(null), 2000)
  }

  const previewContent = () => {
    if (!preview) return ''
    if (preview === 'srt') return generateSRT(subtitles)
    if (preview === 'vtt') return generateVTT(subtitles)
    if (preview === 'txt') return generateTXT(subtitles)
    return ''
  }

  const formats = [
    { id: 'srt' as const, label: 'SRT', desc: 'Universal — VLC, Premiere, YouTube', icon: '🎬', color: '#4c8ee8' },
    { id: 'vtt' as const, label: 'WebVTT', desc: 'Web players, HTML5 video, streaming', icon: '🌐', color: '#4ce8a8' },
    { id: 'txt' as const, label: 'Plain Text', desc: 'Transcript only, no timestamps', icon: '📄', color: '#e8a84c' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      {!hasSubtitles && (
        <div style={{ margin: '16px', padding: '12px 14px', background: 'rgba(232,168,76,0.05)', border: '1px solid rgba(232,168,76,0.15)', borderRadius: '8px', fontSize: '12px', color: '#6b7080', fontFamily: 'monospace' }}>
          ⚠️ Generate subtitles first before exporting.
        </div>
      )}

      {hasSubtitles && (
        <div style={{ display: 'flex', gap: '16px', padding: '12px 16px', borderBottom: '1px solid #272b36', flexShrink: 0 }}>
          {[
            { label: 'Segments', value: subtitles.length },
            { label: 'Words', value: subtitles.reduce((a, s) => a + s.text.split(' ').length, 0) },
            { label: 'Duration', value: `${Math.round(subtitles[subtitles.length - 1]?.end ?? 0)}s` },
          ].map(stat => (
            <div key={stat.label} style={{ textAlign: 'center', flex: 1 }}>
              <div style={{ fontSize: '18px', fontWeight: 800, color: '#e8a84c' }}>{stat.value}</div>
              <div style={{ fontSize: '10px', color: '#6b7080', fontFamily: 'monospace', marginTop: '2px' }}>{stat.label}</div>
            </div>
          ))}
        </div>
      )}

      <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {formats.map(fmt => (
          <div key={fmt.id} style={{ background: '#1c1f27', border: '1px solid #272b36', borderRadius: '10px', overflow: 'hidden' }}>
            <div style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '20px' }}>{fmt.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#e8eaf0' }}>{fmt.label}</div>
                <div style={{ fontSize: '11px', color: '#6b7080', marginTop: '2px' }}>{fmt.desc}</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '6px', padding: '0 12px 12px' }}>
              <button onClick={() => exportSubtitles(subtitles, fmt.id, baseName)} disabled={!hasSubtitles} style={{ flex: 1, padding: '8px', borderRadius: '6px', border: 'none', background: hasSubtitles ? fmt.color : '#272b36', color: hasSubtitles ? '#000' : '#6b7080', fontSize: '12px', fontWeight: 700, cursor: hasSubtitles ? 'pointer' : 'not-allowed', fontFamily: 'inherit' }}>
                ⬇ Download .{fmt.id}
              </button>
              <button onClick={() => handleCopy(fmt.id)} disabled={!hasSubtitles} style={{ padding: '8px 12px', borderRadius: '6px', border: `1px solid ${copied === fmt.id ? 'rgba(76,232,168,0.3)' : '#272b36'}`, background: copied === fmt.id ? 'rgba(76,232,168,0.1)' : '#13151a', color: copied === fmt.id ? '#4ce8a8' : '#6b7080', fontSize: '12px', fontWeight: 600, cursor: hasSubtitles ? 'pointer' : 'not-allowed', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
                {copied === fmt.id ? '✓ Copied!' : '📋 Copy'}
              </button>
              <button onClick={() => setPreview(preview === fmt.id ? null : fmt.id)} disabled={!hasSubtitles} style={{ padding: '8px 12px', borderRadius: '6px', border: `1px solid ${preview === fmt.id ? '#e8a84c' : '#272b36'}`, background: preview === fmt.id ? 'rgba(232,168,76,0.1)' : '#13151a', color: preview === fmt.id ? '#e8a84c' : '#6b7080', fontSize: '12px', fontWeight: 600, cursor: hasSubtitles ? 'pointer' : 'not-allowed', fontFamily: 'inherit' }}>
                👁
              </button>
            </div>
            {preview === fmt.id && hasSubtitles && (
              <div style={{ margin: '0 12px 12px', background: '#0c0d0f', border: '1px solid #272b36', borderRadius: '6px', padding: '10px', maxHeight: '160px', overflowY: 'auto' }}>
                <pre style={{ fontSize: '11px', fontFamily: 'monospace', color: '#a87530', whiteSpace: 'pre-wrap', margin: 0, lineHeight: 1.6 }}>
                  {previewContent().slice(0, 800)}{previewContent().length > 800 ? '\n...' : ''}
                </pre>
              </div>
            )}
          </div>
        ))}
      </div>

      {hasSubtitles && (
        <div style={{ padding: '12px 16px', borderTop: '1px solid #272b36', flexShrink: 0 }}>
          <button
            onClick={() => {
              exportSubtitles(subtitles, 'srt', baseName)
              setTimeout(() => exportSubtitles(subtitles, 'vtt', baseName), 300)
              setTimeout(() => exportSubtitles(subtitles, 'txt', baseName), 600)
            }}
            style={{ width: '100%', padding: '11px', borderRadius: '8px', border: '1px solid #e8a84c', background: 'rgba(232,168,76,0.08)', color: '#e8a84c', fontSize: '13px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
          >
            ⬇ Export All Formats
          </button>
        </div>
      )}
    </div>
  )
}