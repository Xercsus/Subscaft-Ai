export interface Subtitle {
  id: string
  index: number
  start: number
  end: number
  text: string
}

export type SubtitleAnimation =
  | 'none'
  | 'fade'
  | 'slide-up'
  | 'slide-down'
  | 'pop'
  | 'bounce'
  | 'blur'
  | 'word-by-word'
  | 'char-by-char'
  | 'karaoke'
  | 'typewriter'

export interface SubtitleStyle {
  fontFamily: string
  fontSize: number
  fontWeight: string
  color: string
  backgroundColor: string
  backgroundOpacity: number
  textAlign: 'left' | 'center' | 'right'
  position: 'bottom' | 'top' | 'custom'
  x: number
  y: number
  maxWidth: number
  animation: SubtitleAnimation
  animationSpeed: 'slow' | 'normal' | 'fast'
  highlightColor: string
  textStroke: boolean
  textStrokeColor: string
  letterSpacing: number
}

export type TranscriptionEngine = 'browser' | 'whisper'
export type ExportFormat = 'srt' | 'vtt' | 'txt'