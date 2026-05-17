'use client'

import { RefObject, useRef, useCallback, useEffect } from 'react'
import { Subtitle, SubtitleStyle } from '@/types/subtitle'

interface VideoPlayerProps {
  videoUrl: string
  currentSubtitle: Subtitle | null
  currentTime: number
  style: SubtitleStyle
  onTimeUpdate: (time: number) => void
  onPositionChange: (x: number, y: number) => void
  videoRef: RefObject<HTMLVideoElement | null>
}

// ── Animation CSS ──────────────────────────────────────
const ANIMATION_CSS = `
  @keyframes subFadeIn    { from{opacity:0} to{opacity:1} }
  @keyframes subSlideUp   { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
  @keyframes subSlideDown { from{opacity:0;transform:translateY(-20px)} to{opacity:1;transform:translateY(0)} }
  @keyframes subPop       { 0%{opacity:0;transform:scale(0.4)} 70%{transform:scale(1.08)} 100%{opacity:1;transform:scale(1)} }
  @keyframes subBounce    { 0%{opacity:0;transform:translateY(-40px)} 55%{transform:translateY(6px)} 75%{transform:translateY(-4px)} 100%{opacity:1;transform:translateY(0)} }
  @keyframes subBlur      { from{opacity:0;filter:blur(12px)} to{opacity:1;filter:blur(0)} }
  @keyframes subBlink     { 0%,100%{opacity:1} 50%{opacity:0} }
  .sub-drag { cursor: grab; user-select: none; }
  .sub-drag:active { cursor: grabbing; }
  .sub-drag:hover::after {
    content: '✥ drag to move';
    position: absolute;
    top: -22px;
    left: 50%;
    transform: translateX(-50%);
    font-size: 10px;
    font-family: monospace;
    background: rgba(0,0,0,0.7);
    color: #e8a84c;
    padding: 2px 8px;
    border-radius: 4px;
    white-space: nowrap;
    pointer-events: none;
  }
`

function getAnimDuration(speed: SubtitleStyle['animationSpeed']) {
  return speed === 'slow' ? '0.8s' : speed === 'fast' ? '0.12s' : '0.35s'
}

function getAnimation(style: SubtitleStyle): string {
  const dur = getAnimDuration(style.animationSpeed)
  switch (style.animation) {
    case 'fade':      return `subFadeIn ${dur} ease forwards`
    case 'slide-up':  return `subSlideUp ${dur} ease forwards`
    case 'slide-down':return `subSlideDown ${dur} ease forwards`
    case 'pop':       return `subPop ${dur} cubic-bezier(.36,.07,.19,.97) forwards`
    case 'bounce':    return `subBounce ${dur} ease forwards`
    case 'blur':      return `subBlur ${dur} ease forwards`
    default: return 'none'
  }
}

// ── Subtitle Content Renderer ─────────────────────────
function SubtitleContent({
  sub,
  currentTime,
  style,
}: {
  sub: Subtitle
  currentTime: number
  style: SubtitleStyle
}) {
  const words = sub.text.split(' ')
  const duration = Math.max(sub.end - sub.start, 0.1)
  const elapsed = Math.max(currentTime - sub.start, 0)
  const progress = Math.min(elapsed / duration, 1)

  switch (style.animation) {
    case 'word-by-word': {
      const wi = Math.min(Math.floor(progress * words.length), words.length - 1)
      return (
        <span style={{ display: 'inline-block', animation: `subPop 0.2s ease forwards` }}>
          {words[wi]}
        </span>
      )
    }

    case 'char-by-char': {
      const charCount = Math.max(1, Math.floor(progress * sub.text.length))
      return <span>{sub.text.slice(0, charCount)}</span>
    }

    case 'typewriter': {
      const charCount = Math.max(1, Math.floor(progress * sub.text.length))
      return (
        <span>
          {sub.text.slice(0, charCount)}
          <span style={{ animation: 'subBlink 0.7s step-end infinite', display: 'inline-block', marginLeft: '1px', fontWeight: 300 }}>|</span>
        </span>
      )
    }

    case 'karaoke': {
      const wi = Math.min(Math.floor(progress * words.length), words.length - 1)
      return (
        <span>
          {words.map((word, i) => (
            <span
              key={i}
              style={{
                color: i < wi ? style.highlightColor
                     : i === wi ? style.highlightColor
                     : style.color,
                fontWeight: i === wi ? '900' : style.fontWeight,
                fontSize: i === wi ? `${style.fontSize * 1.1}px` : `${style.fontSize}px`,
                transition: 'all 0.1s',
                marginRight: '5px',
                display: 'inline-block',
                textShadow: i === wi ? `0 0 12px ${style.highlightColor}` : 'none',
              }}
            >
              {word}
            </span>
          ))}
        </span>
      )
    }

    default:
      return <span>{sub.text}</span>
  }
}

// ── Main Component ─────────────────────────────────────
export default function VideoPlayer({
  videoUrl,
  currentSubtitle,
  currentTime,
  style,
  onTimeUpdate,
  onPositionChange,
  videoRef,
}: VideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const isDragging = useRef(false)
  const dragOrigin = useRef({ mouseX: 0, mouseY: 0, subX: 0, subY: 0 })

  const handleMouseDown = (e: React.MouseEvent) => {
    if (style.position !== 'custom') return
    e.preventDefault()
    e.stopPropagation()
    isDragging.current = true
    dragOrigin.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      subX: style.x,
      subY: style.y,
    }
  }

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging.current || !containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const dx = ((e.clientX - dragOrigin.current.mouseX) / rect.width) * 100
    const dy = ((e.clientY - dragOrigin.current.mouseY) / rect.height) * 100
    const newX = Math.max(5, Math.min(95, dragOrigin.current.subX + dx))
    const newY = Math.max(5, Math.min(95, dragOrigin.current.subY + dy))
    onPositionChange(newX, newY)
  }, [onPositionChange])

  const handleMouseUp = useCallback(() => { isDragging.current = false }, [])

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [handleMouseMove, handleMouseUp])

  // Compute position
  const getSubPosition = (): React.CSSProperties => {
    if (style.position === 'custom') {
      return {
        left: `${style.x}%`,
        top: `${style.y}%`,
        transform: 'translate(-50%, -50%)',
        bottom: 'auto',
      }
    }
    return {
      left: '50%',
      transform: 'translateX(-50%)',
      bottom: style.position === 'bottom' ? '16px' : 'auto',
      top: style.position === 'top' ? '16px' : 'auto',
    }
  }

  const needsAnimation = !['word-by-word', 'char-by-char', 'typewriter', 'karaoke'].includes(style.animation)

  return (
    <div
      ref={containerRef}
      style={{ position: 'relative', width: '100%', background: '#000', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 8px 40px rgba(0,0,0,0.5)' }}
    >
      <style>{ANIMATION_CSS}</style>

      <video
        ref={videoRef}
        src={videoUrl}
        controls
        style={{ width: '100%', maxHeight: '420px', display: 'block', background: '#000', objectFit: 'contain' }}
        onTimeUpdate={(e) => onTimeUpdate(e.currentTarget.currentTime)}
      />

      {/* Subtitle Overlay */}
      {currentSubtitle && (
        <div
          key={currentSubtitle.id + style.animation}
          onMouseDown={handleMouseDown}
          className={style.position === 'custom' ? 'sub-drag' : ''}
          style={{
            position: 'absolute',
            ...getSubPosition(),
            width: `${style.maxWidth}%`,
            textAlign: style.textAlign,
            fontFamily: style.fontFamily,
            fontSize: `${style.fontSize}px`,
            fontWeight: style.fontWeight as any,
            color: style.color,
            backgroundColor: style.backgroundColor,
            padding: '6px 14px',
            borderRadius: '6px',
            letterSpacing: `${style.letterSpacing}px`,
            WebkitTextStroke: style.textStroke ? `1px ${style.textStrokeColor}` : 'none',
            textShadow: style.textStroke ? 'none' : '0 2px 8px rgba(0,0,0,0.9)',
            pointerEvents: style.position === 'custom' ? 'auto' : 'none',
            animation: needsAnimation ? getAnimation(style) : 'none',
            zIndex: 10,
            boxSizing: 'border-box',
          }}
        >
          <SubtitleContent
            sub={currentSubtitle}
            currentTime={currentTime}
            style={style}
          />
        </div>
      )}

      {/* Position indicator when custom */}
      {style.position === 'custom' && !currentSubtitle && (
        <div style={{
          position: 'absolute',
          left: `${style.x}%`,
          top: `${style.y}%`,
          transform: 'translate(-50%, -50%)',
          border: '1px dashed rgba(232,168,76,0.4)',
          borderRadius: '6px',
          padding: '4px 12px',
          color: 'rgba(232,168,76,0.5)',
          fontSize: '11px',
          fontFamily: 'monospace',
          pointerEvents: 'none',
          whiteSpace: 'nowrap',
        }}>
          subtitle position
        </div>
      )}
    </div>
  )
}