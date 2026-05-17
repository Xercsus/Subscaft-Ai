import { FFmpeg } from '@ffmpeg/ffmpeg'
import { fetchFile, toBlobURL } from '@ffmpeg/util'
import { Subtitle, SubtitleStyle } from '@/types/subtitle'

// ─────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────

export interface RenderOptions {
  videoFile: File
  subtitles: Subtitle[]
  style: SubtitleStyle
  onProgress: (pct: number, msg: string) => void
  onDone: (blob: Blob) => void
  onError: (msg: string) => void
}

interface TextLine {
  text: string
  width: number
}

// ─────────────────────────────────────────────────────
// FFmpeg Singleton
// ─────────────────────────────────────────────────────

let ffmpegInstance: FFmpeg | null = null

async function getFFmpeg(onProgress?: (msg: string) => void): Promise<FFmpeg> {
  if (ffmpegInstance && ffmpegInstance.loaded) return ffmpegInstance

  ffmpegInstance = new FFmpeg()

  ffmpegInstance.on('log', ({ message }) => {
    onProgress?.(message)
  })

  ffmpegInstance.on('progress', ({ progress }) => {
    onProgress?.(`Converting: ${Math.round(progress * 100)}%`)
  })

  const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd'
  await ffmpegInstance.load({
    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
  })

  return ffmpegInstance
}

export async function convertWebMToMP4(
  webmBlob: Blob,
  onProgress?: (msg: string) => void
): Promise<Blob> {
  onProgress?.('Loading MP4 converter...')
  const ff = await getFFmpeg(onProgress)

  onProgress?.('Writing WebM data...')
  const webmData = await fetchFile(webmBlob)
  await ff.writeFile('input.webm', webmData)

  onProgress?.('Converting WebM → MP4...')
  await ff.exec([
    '-i', 'input.webm',
    '-c:v', 'libx264',
    '-preset', 'fast',
    '-crf', '23',
    '-c:a', 'aac',
    '-b:a', '192k',
    '-movflags', '+faststart',
    '-pix_fmt', 'yuv420p',
    '-y',
    'output.mp4',
  ])

  onProgress?.('Reading MP4...')
  const data = await ff.readFile('output.mp4')
  onProgress?.('MP4 ready!')

  // ✅ Copy into plain ArrayBuffer to avoid SharedArrayBuffer issues
  let bytes: Uint8Array
  if (typeof data === 'string') {
    const binary = atob(data)
    bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i)
    }
  } else {
    // Copy to fresh ArrayBuffer (fixes SharedArrayBuffer → Blob error)
    bytes = new Uint8Array(data.buffer.slice(0))
  }

  return new Blob([bytes.buffer as ArrayBuffer], { type: 'video/mp4' })
}

// ─────────────────────────────────────────────────────
// Text Utilities
// ─────────────────────────────────────────────────────

function setFont(
  ctx: CanvasRenderingContext2D,
  style: SubtitleStyle,
  scale = 1
) {
  const family = style.fontFamily.split(',')[0].replace(/['"]/g, '').trim()
  ctx.font = `${style.fontWeight} ${Math.round(style.fontSize * scale)}px "${family}"`
  ctx.letterSpacing = `${style.letterSpacing}px`
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): TextLine[] {
  const words = text.split(' ')
  const lines: TextLine[] = []
  let current = ''

  for (const word of words) {
    const test = current ? `${current} ${word}` : word
    const w = ctx.measureText(test).width
    if (w > maxWidth && current) {
      lines.push({ text: current, width: ctx.measureText(current).width })
      current = word
    } else {
      current = test
    }
  }

  if (current) {
    lines.push({ text: current, width: ctx.measureText(current).width })
  }

  return lines
}

function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace('#', '')
  const r = parseInt(clean.slice(0, 2), 16)
  const g = parseInt(clean.slice(2, 4), 16)
  const b = parseInt(clean.slice(4, 6), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

function parseRgba(rgba: string): { r: number; g: number; b: number; a: number } {
  const match = rgba.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/)
  if (!match) return { r: 0, g: 0, b: 0, a: 0.6 }
  return {
    r: parseInt(match[1]),
    g: parseInt(match[2]),
    b: parseInt(match[3]),
    a: match[4] ? parseFloat(match[4]) : 1,
  }
}

// ─────────────────────────────────────────────────────
// Animation Helpers
// ─────────────────────────────────────────────────────

function getAnimationProgress(
  sub: Subtitle,
  currentTime: number
): number {
  const duration = Math.max(sub.end - sub.start, 0.01)
  const elapsed = Math.max(currentTime - sub.start, 0)
  return Math.min(elapsed / duration, 1)
}

function getAnimationAlpha(
  sub: Subtitle,
  currentTime: number,
  style: SubtitleStyle
): number {
  const elapsed = currentTime - sub.start
  const remaining = sub.end - currentTime

  const speedMap = {
    slow: 0.6,
    normal: 0.3,
    fast: 0.12,
  }
  const fadeDur = speedMap[style.animationSpeed] ?? 0.3

  switch (style.animation) {
    case 'fade':
    case 'slide-up':
    case 'slide-down':
    case 'blur': {
      const fadeIn = Math.min(elapsed / fadeDur, 1)
      const fadeOut = remaining < fadeDur ? Math.min(remaining / fadeDur, 1) : 1
      return Math.min(fadeIn, fadeOut)
    }
    case 'pop':
    case 'bounce': {
      return Math.min(elapsed / fadeDur, 1)
    }
    default:
      return 1
  }
}

function getAnimationOffset(
  sub: Subtitle,
  currentTime: number,
  style: SubtitleStyle,
  canvasH: number
): { x: number; y: number; scale: number } {
  const elapsed = currentTime - sub.start
  const speedMap = { slow: 0.6, normal: 0.3, fast: 0.12 }
  const dur = speedMap[style.animationSpeed] ?? 0.3
  const t = Math.min(elapsed / dur, 1)
  const easeOut = 1 - Math.pow(1 - t, 3)
  const easeOutBack = t < 1 ? 1 - Math.pow(1 - t, 2) * ((2.5 + 1) * (1 - t) - 2.5) : 1

  switch (style.animation) {
    case 'slide-up':
      return { x: 0, y: (1 - easeOut) * 30, scale: 1 }
    case 'slide-down':
      return { x: 0, y: -(1 - easeOut) * 30, scale: 1 }
    case 'pop':
      return { x: 0, y: 0, scale: 0.4 + 0.6 * easeOutBack }
    case 'bounce': {
      const bounceT = Math.min(elapsed / (dur * 1.5), 1)
      const b = bounceT < 0.5
        ? -30 * (1 - bounceT * 2) * (1 - bounceT * 2)
        : bounceT < 0.75
        ? 8 * Math.sin((bounceT - 0.5) * Math.PI * 2)
        : bounceT < 0.9
        ? -4 * Math.sin((bounceT - 0.75) * Math.PI * 2)
        : 0
      return { x: 0, y: b, scale: 1 }
    }
    default:
      return { x: 0, y: 0, scale: 1 }
  }
}

// ─────────────────────────────────────────────────────
// Compute subtitle base position on canvas
// ─────────────────────────────────────────────────────

function getBasePosition(
  style: SubtitleStyle,
  canvasW: number,
  canvasH: number
): { x: number; y: number } {
  if (style.position === 'custom') {
    return {
      x: (style.x / 100) * canvasW,
      y: (style.y / 100) * canvasH,
    }
  }
  return {
    x: canvasW / 2,
    y: style.position === 'top'
      ? style.fontSize * 2
      : canvasH - style.fontSize * 2.2,
  }
}

// ─────────────────────────────────────────────────────
// Draw rounded rectangle helper
// ─────────────────────────────────────────────────────

function drawRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

// ─────────────────────────────────────────────────────
// Draw single line of text with background
// ─────────────────────────────────────────────────────

function drawTextLine(
  ctx: CanvasRenderingContext2D,
  text: string,
  cx: number,
  cy: number,
  style: SubtitleStyle,
  alpha: number,
  scale: number,
  overrideColor?: string
) {
  const fs = style.fontSize * scale
  setFont(ctx, style, scale)

  const metrics = ctx.measureText(text)
  const tw = metrics.width
  const th = fs * 1.4
  const pad = { x: 16 * scale, y: 8 * scale }

  // Compute left edge based on alignment
  let lx: number
  if (style.textAlign === 'center') lx = cx - tw / 2
  else if (style.textAlign === 'right') lx = cx - tw
  else lx = cx

  // Background
  const bg = parseRgba(style.backgroundColor)
  ctx.fillStyle = `rgba(${bg.r},${bg.g},${bg.b},${bg.a * alpha})`
  drawRoundRect(
    ctx,
    lx - pad.x,
    cy - th / 2 - pad.y / 2,
    tw + pad.x * 2,
    th + pad.y,
    6 * scale
  )
  ctx.fill()

  // Text shadow (only if no stroke)
  if (!style.textStroke) {
    ctx.shadowColor = `rgba(0,0,0,${0.9 * alpha})`
    ctx.shadowBlur = 10 * scale
    ctx.shadowOffsetX = 0
    ctx.shadowOffsetY = 2 * scale
  }

  // Text stroke
  if (style.textStroke) {
    ctx.strokeStyle = `rgba(${hexToRgba(style.textStrokeColor, alpha)})`
    ctx.lineWidth = 2 * scale
    ctx.textAlign = style.textAlign
    ctx.textBaseline = 'middle'
    ctx.strokeText(text, cx, cy)
  }

  // Main text
  ctx.fillStyle = overrideColor
    ? overrideColor.replace(')', `,${alpha})`).replace('rgb(', 'rgba(')
    : `rgba(${hexToRgba(style.color, alpha)})`
  ctx.textAlign = style.textAlign
  ctx.textBaseline = 'middle'
  ctx.fillText(text, cx, cy)

  // Reset shadow
  ctx.shadowColor = 'transparent'
  ctx.shadowBlur = 0
  ctx.shadowOffsetX = 0
  ctx.shadowOffsetY = 0
}

// ─────────────────────────────────────────────────────
// KARAOKE Renderer
// ─────────────────────────────────────────────────────

function drawKaraoke(
  ctx: CanvasRenderingContext2D,
  sub: Subtitle,
  currentTime: number,
  style: SubtitleStyle,
  baseX: number,
  baseY: number,
  alpha: number,
  scale: number
) {
  const words = sub.text.split(' ')
  const progress = getAnimationProgress(sub, currentTime)
  const activeIndex = Math.min(
    Math.floor(progress * words.length),
    words.length - 1
  )

  setFont(ctx, style, scale)

  // Measure total width
  const wordMetrics = words.map(w => ({
    word: w,
    width: ctx.measureText(w + ' ').width,
  }))
  const totalW = wordMetrics.reduce((a, m) => a + m.width, 0)

  // Background behind all words
  const th = style.fontSize * scale * 1.4
  const pad = { x: 16 * scale, y: 8 * scale }
  let bgX: number
  if (style.textAlign === 'center') bgX = baseX - totalW / 2 - pad.x
  else if (style.textAlign === 'right') bgX = baseX - totalW - pad.x
  else bgX = baseX - pad.x

  const bg = parseRgba(style.backgroundColor)
  ctx.fillStyle = `rgba(${bg.r},${bg.g},${bg.b},${bg.a * alpha})`
  drawRoundRect(ctx, bgX, baseY - th / 2 - pad.y / 2, totalW + pad.x * 2, th + pad.y, 6 * scale)
  ctx.fill()

  // Draw each word
  let curX = bgX + pad.x
  wordMetrics.forEach(({ word, width }, i) => {
    const isActive = i === activeIndex
    const isDone = i < activeIndex

    // Glow for active word
    if (isActive) {
      ctx.shadowColor = style.highlightColor
      ctx.shadowBlur = 20 * scale
    }

    const wordScale = isActive ? scale * 1.12 : scale
    setFont(ctx, style, wordScale)

    const color = isActive || isDone ? style.highlightColor : style.color
    const rgba = parseRgba(
      color.startsWith('#')
        ? hexToRgba(color, alpha)
        : color
    )

    ctx.fillStyle = `rgba(${rgba.r},${rgba.g},${rgba.b},${alpha})`
    ctx.textAlign = 'left'
    ctx.textBaseline = 'middle'
    ctx.fillText(word, curX, baseY)

    ctx.shadowBlur = 0
    curX += width
  })

  ctx.shadowColor = 'transparent'
  ctx.shadowBlur = 0
}

// ─────────────────────────────────────────────────────
// WORD-BY-WORD Renderer
// ─────────────────────────────────────────────────────

function drawWordByWord(
  ctx: CanvasRenderingContext2D,
  sub: Subtitle,
  currentTime: number,
  style: SubtitleStyle,
  baseX: number,
  baseY: number,
  alpha: number,
  scale: number
) {
  const words = sub.text.split(' ')
  const progress = getAnimationProgress(sub, currentTime)
  const wi = Math.min(Math.floor(progress * words.length), words.length - 1)
  const word = words[wi] ?? words[0]

  // Pop scale for word transitions
  const wordDuration = (sub.end - sub.start) / words.length
  const wordElapsed = (currentTime - sub.start) % wordDuration
  const popProgress = Math.min(wordElapsed / 0.1, 1)
  const popScale = scale * (0.7 + 0.3 * (1 - Math.pow(1 - popProgress, 2)))

  // Glow
  ctx.shadowColor = style.highlightColor
  ctx.shadowBlur = 16 * scale

  drawTextLine(ctx, word, baseX, baseY, style, alpha, popScale, style.highlightColor)

  ctx.shadowBlur = 0
}

// ─────────────────────────────────────────────────────
// CHAR-BY-CHAR / TYPEWRITER Renderer
// ─────────────────────────────────────────────────────

function drawCharByChar(
  ctx: CanvasRenderingContext2D,
  sub: Subtitle,
  currentTime: number,
  style: SubtitleStyle,
  baseX: number,
  baseY: number,
  alpha: number,
  scale: number,
  withCursor: boolean
) {
  const progress = getAnimationProgress(sub, currentTime)
  const charCount = Math.max(1, Math.floor(progress * sub.text.length))
  let text = sub.text.slice(0, charCount)
  if (withCursor && Math.floor(currentTime * 2) % 2 === 0) text += '|'

  const maxW = (style.maxWidth / 100) * ctx.canvas.width
  setFont(ctx, style, scale)
  const lines = wrapText(ctx, text, maxW)
  const lineH = style.fontSize * scale * 1.5
  const startY = baseY - ((lines.length - 1) * lineH) / 2

  lines.forEach((line, i) => {
    drawTextLine(ctx, line.text, baseX, startY + i * lineH, style, alpha, scale)
  })
}

// ─────────────────────────────────────────────────────
// BLUR Renderer (simulated with multiple draws)
// ─────────────────────────────────────────────────────

function drawBlurIn(
  ctx: CanvasRenderingContext2D,
  text: string,
  baseX: number,
  baseY: number,
  style: SubtitleStyle,
  alpha: number,
  scale: number,
  elapsed: number
) {
  const speedMap = { slow: 0.8, normal: 0.4, fast: 0.15 }
  const dur = speedMap[style.animationSpeed] ?? 0.4
  const t = Math.min(elapsed / dur, 1)
  const blurPasses = Math.max(1, Math.round((1 - t) * 6))

  for (let p = 0; p < blurPasses; p++) {
    const offset = (blurPasses - p) * 2 * (1 - t)
    ctx.globalAlpha = alpha / blurPasses
    drawTextLine(ctx, text, baseX + offset, baseY, style, 1, scale)
    drawTextLine(ctx, text, baseX - offset, baseY, style, 1, scale)
  }
  ctx.globalAlpha = 1
}

// ─────────────────────────────────────────────────────
// Master Draw Subtitle
// ─────────────────────────────────────────────────────

function drawSubtitle(
  ctx: CanvasRenderingContext2D,
  sub: Subtitle,
  currentTime: number,
  style: SubtitleStyle,
  canvasW: number,
  canvasH: number
) {
  const alpha = getAnimationAlpha(sub, currentTime, style)
  if (alpha <= 0) return

  const { x: offsetX, y: offsetY, scale: scaleAnim } = getAnimationOffset(
    sub, currentTime, style, canvasH
  )

  const base = getBasePosition(style, canvasW, canvasH)
  const bx = base.x + offsetX
  const by = base.y + offsetY

  const maxW = (style.maxWidth / 100) * canvasW
  const elapsed = currentTime - sub.start

  ctx.save()

  // Scale transform for pop/bounce
  if (scaleAnim !== 1) {
    ctx.translate(bx, by)
    ctx.scale(scaleAnim, scaleAnim)
    ctx.translate(-bx, -by)
  }

  // ── Animation-specific renderers ─────────────────
  switch (style.animation) {

    case 'karaoke': {
      drawKaraoke(ctx, sub, currentTime, style, bx, by, alpha, 1)
      break
    }

    case 'word-by-word': {
      drawWordByWord(ctx, sub, currentTime, style, bx, by, alpha, 1)
      break
    }

    case 'char-by-char': {
      drawCharByChar(ctx, sub, currentTime, style, bx, by, alpha, 1, false)
      break
    }

    case 'typewriter': {
      drawCharByChar(ctx, sub, currentTime, style, bx, by, alpha, 1, true)
      break
    }

    case 'blur': {
      setFont(ctx, style, 1)
      const lines = wrapText(ctx, sub.text, maxW)
      const lineH = style.fontSize * 1.5
      const startY = by - ((lines.length - 1) * lineH) / 2
      lines.forEach((line, i) => {
        drawBlurIn(ctx, line.text, bx, startY + i * lineH, style, alpha, 1, elapsed)
      })
      break
    }

    // ── All other animations (fade, slide, pop, bounce, none) ──
    default: {
      setFont(ctx, style, 1)
      const lines = wrapText(ctx, sub.text, maxW)
      const lineH = style.fontSize * 1.5
      const startY = by - ((lines.length - 1) * lineH) / 2

      lines.forEach((line, i) => {
        drawTextLine(ctx, line.text, bx, startY + i * lineH, style, alpha, 1)
      })
      break
    }
  }

  ctx.restore()
}

// ─────────────────────────────────────────────────────
// Main Render Function
// ─────────────────────────────────────────────────────

export async function renderVideoWithSubtitles(options: RenderOptions): Promise<void> {
  const { videoFile, subtitles, style, onProgress, onDone, onError } = options

  try {
    // ── Load video ────────────────────────────────
    onProgress(2, 'Loading video...')

    const video = document.createElement('video')
    video.preload = 'auto'
    video.playsInline = true
    video.muted = false
    video.src = URL.createObjectURL(videoFile)

    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Video load timeout')), 20000)
      video.onloadedmetadata = () => {
        clearTimeout(timeout)
        resolve()
      }
      video.onerror = () => {
        clearTimeout(timeout)
        reject(new Error('Failed to load video file'))
      }
    })

    const W = video.videoWidth
    const H = video.videoHeight
    const duration = video.duration
    const FPS = 30

    onProgress(5, `Video: ${W}×${H} · ${duration.toFixed(1)}s · ${FPS}fps`)

    // ── Setup canvas ──────────────────────────────
    const canvas = document.createElement('canvas')
    canvas.width = W
    canvas.height = H
    const ctx = canvas.getContext('2d', { willReadFrequently: false })!

    // ── Audio setup ───────────────────────────────
    const audioCtx = new AudioContext()
    const source = audioCtx.createMediaElementSource(video)
    const dest = audioCtx.createMediaStreamDestination()
    const gainNode = audioCtx.createGain()
    gainNode.gain.value = 1.0

    source.connect(gainNode)
    gainNode.connect(dest)
    gainNode.connect(audioCtx.destination)

    // ── Combine streams ───────────────────────────
    const videoStream = canvas.captureStream(FPS)
    const combinedStream = new MediaStream([
      ...videoStream.getVideoTracks(),
      ...dest.stream.getAudioTracks(),
    ])

    // ── MediaRecorder setup ───────────────────────
    const mimeTypes = [
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm;codecs=h264,opus',
      'video/webm',
    ]

    const mimeType = mimeTypes.find(m => MediaRecorder.isTypeSupported(m)) ?? 'video/webm'
    onProgress(6, `Recording format: ${mimeType}`)

    const recorder = new MediaRecorder(combinedStream, {
      mimeType,
      videoBitsPerSecond: Math.min(W * H * FPS * 0.1, 12_000_000),
    })

    const chunks: Blob[] = []
    recorder.ondataavailable = e => {
      if (e.data && e.data.size > 0) chunks.push(e.data)
    }

    // ── Render promise ────────────────────────────
    const renderComplete = new Promise<Blob>((resolve, reject) => {
      recorder.onstop = () => {
        try {
          audioCtx.close()
          const blob = new Blob(chunks, { type: mimeType })
          resolve(blob)
        } catch (err: any) {
          reject(err)
        }
      }
      recorder.onerror = (e: any) => reject(new Error('Recorder error: ' + e.error))
    })

    // ── Start ─────────────────────────────────────
    recorder.start(200)

    await new Promise<void>(res => {
      video.oncanplaythrough = () => res()
      video.load()
    })

    video.currentTime = 0
    await video.play()

    onProgress(8, 'Rendering frames...')

    // ── Frame render loop ─────────────────────────
    let lastTime = -1
    let rafId: number

    const renderLoop = () => {
      const t = video.currentTime

      if (t !== lastTime) {
        lastTime = t

        // Clear
        ctx.clearRect(0, 0, W, H)

        // Draw video frame
        ctx.drawImage(video, 0, 0, W, H)

        // Find active subtitle
        const sub = subtitles.find(
          s => t >= s.start && t <= s.end + 0.05
        )

        // Draw subtitle overlay
        if (sub) {
          drawSubtitle(ctx, sub, t, style, W, H)
        }

        // Update progress (render = 8% to 85%)
        const renderPct = t / duration
        const pct = Math.round(8 + renderPct * 77)
        if (Math.round(t * 2) % 2 === 0) {
          onProgress(pct, `Rendering: ${t.toFixed(1)}s / ${duration.toFixed(1)}s`)
        }
      }

      if (!video.paused && !video.ended) {
        rafId = requestAnimationFrame(renderLoop)
      } else {
        // Done rendering
        onProgress(86, 'Finalising render...')
        setTimeout(() => {
          recorder.stop()
          video.src = ''
        }, 600)
      }
    }

    video.onended = () => {
      cancelAnimationFrame(rafId)
      onProgress(86, 'Finalising render...')
      setTimeout(() => {
        try { recorder.stop() } catch (_) {}
        video.src = ''
      }, 600)
    }

    rafId = requestAnimationFrame(renderLoop)

    // ── Wait for render to complete ───────────────
    onProgress(10, 'Rendering in progress...')
    const webmBlob = await renderComplete

    onProgress(87, `Render complete: ${(webmBlob.size / 1024 / 1024).toFixed(1)} MB WebM`)
    onDone(webmBlob)

  } catch (err: any) {
    console.error('[canvasRenderer] Error:', err)
    onError(err?.message ?? 'Unknown render error')
  }
}