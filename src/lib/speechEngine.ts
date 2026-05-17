export interface SpeechSegment {
  id: string
  start: number
  end: number
  text: string
}

export interface SpeechEngineOptions {
  language: string
  wordsPerSegment: number
  pacingGap: number // seconds between segments
  onInterim: (text: string, start: number) => void
  onFinal: (segment: SpeechSegment) => void
  onError: (error: string) => void
  onStart: () => void
  onStop: () => void
}

export class SpeechEngine {
  private recognition: any = null
  private isRunning = false
  private segmentStart = 0
  private options: SpeechEngineOptions
  private getVideoTime: (() => number) | null = null
  private restartTimer: any = null
  private lastResultTime = 0
  private watchdogTimer: any = null

  constructor(options: SpeechEngineOptions) {
    this.options = options
  }

  isSupported(): boolean {
    return typeof window !== 'undefined' &&
      ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)
  }

  setVideoTimeGetter(fn: () => number) {
    this.getVideoTime = fn
  }

  private now(): number {
    return this.getVideoTime ? this.getVideoTime() : 0
  }

  // ── Split text into chunks of N words ─────────────
  private splitIntoSegments(text: string): string[] {
    const words = text.trim().split(/\s+/).filter(Boolean)
    const n = Math.max(1, this.options.wordsPerSegment)
    const chunks: string[] = []

    for (let i = 0; i < words.length; i += n) {
      const chunk = words.slice(i, i + n).join(' ')
      if (chunk.trim()) chunks.push(chunk.trim())
    }

    return chunks.length > 0 ? chunks : [text]
  }

  // ── Emit each chunk as a separate segment ──────────
  private emitSegments(text: string, startTime: number, endTime: number) {
    const chunks = this.splitIntoSegments(text)
    const gap = this.options.pacingGap
    const totalDuration = Math.max(endTime - startTime, chunks.length * 0.8)
    const durationPerChunk = totalDuration / chunks.length

    chunks.forEach((chunk, i) => {
      const start = startTime + i * durationPerChunk
      const end = start + durationPerChunk - gap

      this.options.onFinal({
        id: crypto.randomUUID(),
        start: parseFloat(Math.max(0, start).toFixed(3)),
        end: parseFloat(Math.max(start + 0.1, end).toFixed(3)),
        text: chunk,
      })
    })

    // ✅ Always update segmentStart after emitting
    this.segmentStart = endTime
  }

  // ── Start watchdog — force restart if stuck ────────
  private startWatchdog() {
    this.clearWatchdog()
    this.watchdogTimer = setInterval(() => {
      if (!this.isRunning) return
      const now = Date.now()
      // If no result in 8 seconds — force restart
      if (now - this.lastResultTime > 8000) {
        console.log('[SpeechEngine] Watchdog: no results, restarting...')
        this.forceRestart()
      }
    }, 5000)
  }

  private clearWatchdog() {
    if (this.watchdogTimer) {
      clearInterval(this.watchdogTimer)
      this.watchdogTimer = null
    }
  }

  private forceRestart() {
    if (!this.isRunning) return
    try {
      if (this.recognition) {
        this.recognition.onend = null
        this.recognition.onerror = null
        this.recognition.stop()
      }
    } catch (_) {}

    setTimeout(() => {
      if (!this.isRunning) return
      this.createAndStartRecognition()
    }, 300)
  }

  // ── Create fresh recognition instance ─────────────
  private createAndStartRecognition() {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    const rec = new SR()
    rec.continuous = true
    rec.interimResults = true
    rec.lang = this.options.language
    rec.maxAlternatives = 1

    rec.onstart = () => {
      this.lastResultTime = Date.now()
      this.options.onStart()
    }

    rec.onresult = (event: any) => {
      this.lastResultTime = Date.now()
      let interim = ''
      let finalText = ''

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript.trim()
        if (event.results[i].isFinal) {
          finalText += ' ' + transcript
        } else {
          interim = transcript
        }
      }

      finalText = finalText.trim()

      if (finalText) {
        const endTime = this.now()
        const startTime = this.segmentStart
        this.emitSegments(finalText, startTime, endTime)
      } else if (interim) {
        this.options.onInterim(interim, this.segmentStart)
      }
    }

    rec.onerror = (event: any) => {
      this.lastResultTime = Date.now()
      if (event.error === 'no-speech') return
      if (event.error === 'network' || event.error === 'aborted') {
        if (this.isRunning) {
          setTimeout(() => {
            if (this.isRunning) this.createAndStartRecognition()
          }, 500)
        }
        return
      }
      this.options.onError(`Recognition error: ${event.error}`)
    }

    // ✅ Key fix: always restart on end while running
    rec.onend = () => {
      if (!this.isRunning) {
        this.options.onStop()
        return
      }
      // Small delay before restart to prevent CPU spin
      this.restartTimer = setTimeout(() => {
        if (this.isRunning) this.createAndStartRecognition()
      }, 150)
    }

    this.recognition = rec

    try {
      rec.start()
    } catch (err) {
      console.error('[SpeechEngine] Failed to start:', err)
      setTimeout(() => {
        if (this.isRunning) this.createAndStartRecognition()
      }, 500)
    }
  }

  start(currentVideoTime: number) {
    if (!this.isSupported()) {
      this.options.onError('Speech recognition not supported. Please use Chrome.')
      return
    }

    this.segmentStart = currentVideoTime
    this.isRunning = true
    this.lastResultTime = Date.now()

    this.createAndStartRecognition()
    this.startWatchdog()
  }

  stop() {
    this.isRunning = false
    this.clearWatchdog()

    if (this.restartTimer) {
      clearTimeout(this.restartTimer)
      this.restartTimer = null
    }

    if (this.recognition) {
      this.recognition.onend = null
      this.recognition.onerror = null
      try { this.recognition.stop() } catch (_) {}
      this.recognition = null
    }

    this.options.onStop()
  }

  updateSegmentStart(time: number) {
    this.segmentStart = time
  }
}