import { FFmpeg } from '@ffmpeg/ffmpeg'
import { fetchFile, toBlobURL } from '@ffmpeg/util'
import { Subtitle } from '@/types/subtitle'
import { generateSRT } from './exportUtils'

let ffmpeg: FFmpeg | null = null

// ── Load ffmpeg once ──────────────────────────────────
export async function loadFFmpeg(
  onProgress?: (message: string) => void
): Promise<FFmpeg> {
  if (ffmpeg && ffmpeg.loaded) return ffmpeg

  ffmpeg = new FFmpeg()

  ffmpeg.on('log', ({ message }) => {
    onProgress?.(message)
  })

  ffmpeg.on('progress', ({ progress }) => {
    onProgress?.(`Processing: ${Math.round(progress * 100)}%`)
  })

  const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd'

  await ffmpeg.load({
    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
  })

  return ffmpeg
}

// ── Generate ASS subtitle format (supports styling) ───
export function generateASS(subtitles: Subtitle[], style: {
  fontFamily: string
  fontSize: number
  color: string
  position: 'bottom' | 'top'
}): string {
  // Convert hex color to ASS format (&HAABBGGRR)
  const hexToASS = (hex: string): string => {
    const clean = hex.replace('#', '')
    if (clean.length === 6) {
      const r = clean.slice(0, 2)
      const g = clean.slice(2, 4)
      const b = clean.slice(4, 6)
      return `&H00${b}${g}${r}`
    }
    return '&H00FFFFFF'
  }

  const toASSTime = (sec: number): string => {
    const h = Math.floor(sec / 3600)
    const m = Math.floor((sec % 3600) / 60)
    const s = Math.floor(sec % 60)
    const cs = Math.floor((sec % 1) * 100)
    return `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}.${String(cs).padStart(2,'0')}`
  }

  const alignment = style.position === 'bottom' ? 2 : 8
  const fontName = style.fontFamily.split(',')[0].trim()
  const assColor = hexToASS(style.color)

  const header = `[Script Info]
ScriptType: v4.00+
PlayResX: 1280
PlayResY: 720

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, BackColour, Bold, Italic, Alignment, MarginL, MarginR, MarginV, BorderStyle, Outline, Shadow
Style: Default,${fontName},${style.fontSize * 2},${assColor},&H80000000,0,0,${alignment},10,10,20,1,2,1

[Events]
Format: Layer, Start, End, Style, Text
`

  const events = subtitles
    .map((sub) =>
      `Dialogue: 0,${toASSTime(sub.start)},${toASSTime(sub.end)},Default,${sub.text}`
    )
    .join('\n')

  return header + events
}

// ── Main burn function ────────────────────────────────
export async function burnSubtitles(
  videoFile: File,
  subtitles: Subtitle[],
  style: {
    fontFamily: string
    fontSize: number
    color: string
    position: 'bottom' | 'top'
  },
  onProgress?: (message: string) => void
): Promise<Blob> {
  onProgress?.('Loading ffmpeg...')
  const ff = await loadFFmpeg(onProgress)

  const inputName = 'input.mp4'
  const subtitleName = 'subs.srt'
  const outputName = 'output.mp4'

  onProgress?.('Loading video file...')
  await ff.writeFile(inputName, await fetchFile(videoFile))

  onProgress?.('Writing subtitle file...')
  const srtContent = generateSRT(subtitles)
  await ff.writeFile(subtitleName, srtContent)

  onProgress?.('Burning subtitles into video...')

  await ff.exec([
    '-i', inputName,
    '-vf', `subtitles=${subtitleName}:force_style='FontName=${style.fontFamily.split(',')[0].trim()},FontSize=${style.fontSize},PrimaryColour=&H00FFFFFF,Outline=2,Shadow=1,Alignment=${style.position === 'bottom' ? 2 : 8}'`,
    '-c:a', 'copy',
    '-y',
    outputName,
  ])

  onProgress?.('Reading output...')
  const data = await ff.readFile(outputName)

  onProgress?.('Done!')
  const bytes = typeof data === 'string'
  ? new TextEncoder().encode(data)
  : new Uint8Array(data.buffer.slice(0))

return new Blob([bytes.buffer as ArrayBuffer], { type: 'video/mp4' })
}