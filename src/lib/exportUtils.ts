import { Subtitle } from '@/types/subtitle'

// ── Timestamp Formatters ──────────────────────────────
function toSRTTime(sec: number): string {
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = Math.floor(sec % 60)
  const ms = Math.floor((sec % 1) * 1000)
  return `${pad(h)}:${pad(m)}:${pad(s)},${String(ms).padStart(3, '0')}`
}

function toVTTTime(sec: number): string {
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = Math.floor(sec % 60)
  const ms = Math.floor((sec % 1) * 1000)
  return `${pad(h)}:${pad(m)}:${pad(s)}.${String(ms).padStart(3, '0')}`
}

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

// ── Export Generators ─────────────────────────────────
export function generateSRT(subtitles: Subtitle[]): string {
  return subtitles
    .map((sub, i) =>
      `${i + 1}\n${toSRTTime(sub.start)} --> ${toSRTTime(sub.end)}\n${sub.text}`
    )
    .join('\n\n')
}

export function generateVTT(subtitles: Subtitle[]): string {
  const body = subtitles
    .map((sub, i) =>
      `${i + 1}\n${toVTTTime(sub.start)} --> ${toVTTTime(sub.end)}\n${sub.text}`
    )
    .join('\n\n')
  return `WEBVTT\n\n${body}`
}

export function generateTXT(subtitles: Subtitle[]): string {
  return subtitles.map((sub) => sub.text).join('\n')
}

// ── Downloader ────────────────────────────────────────
export function downloadFile(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

// ── Main Export Function ──────────────────────────────
export function exportSubtitles(
  subtitles: Subtitle[],
  format: 'srt' | 'vtt' | 'txt',
  filename = 'subtitles'
) {
  if (subtitles.length === 0) return

  switch (format) {
    case 'srt':
      downloadFile(`${filename}.srt`, generateSRT(subtitles), 'text/plain')
      break
    case 'vtt':
      downloadFile(`${filename}.vtt`, generateVTT(subtitles), 'text/vtt')
      break
    case 'txt':
      downloadFile(`${filename}.txt`, generateTXT(subtitles), 'text/plain')
      break
  }
}