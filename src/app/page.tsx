'use client'

import { useState, useRef, useCallback } from 'react'
import UploadZone from '@/components/UploadZone'
import EmailCapture from '@/components/EmailCapture'
import VideoPlayer from '@/components/VideoPlayer'
import ControlBar from '@/components/ControlBar'
import SubtitleList from '@/components/SubtitleList'
import CustomisePanel from '@/components/CustomisePanel'
import ExportPanel from '@/components/ExportPanel'
import BurnPanel from '@/components/BurnPanel'
import SyncPlayer from '@/components/SyncPlayer'
import { SpeechEngine, SpeechSegment } from '@/lib/speechEngine'
import { Subtitle, SubtitleStyle } from '@/types/subtitle'

const defaultStyle: SubtitleStyle = {
  fontFamily: 'Inter, sans-serif',
  fontSize: 20,
  fontWeight: '700',
  color: '#ffffff',
  backgroundColor: 'rgba(0,0,0,0.6)',
  backgroundOpacity: 0.6,
  textAlign: 'center',
  position: 'bottom',
  x: 50,
  y: 85,
  maxWidth: 80,
  animation: 'fade',
  animationSpeed: 'normal',
  highlightColor: '#ffff00',
  textStroke: false,
  textStrokeColor: '#000000',
  letterSpacing: 0,
}

type RightTab = 'subtitles' | 'customise' | 'export' | 'preview' | 'burn'

export default function Home() {
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [subtitles, setSubtitles] = useState<Subtitle[]>([])
  const [currentTime, setCurrentTime] = useState(0)
  const [isRecording, setIsRecording] = useState(false)
  const [status, setStatus] = useState('idle')
  const [interimText, setInterimText] = useState('')
  const [style, setStyle] = useState<SubtitleStyle>(defaultStyle)
  const [activeTab, setActiveTab] = useState<RightTab>('subtitles')
  const [language, setLanguage] = useState('en-US')
  const [wordsPerSegment, setWordsPerSegment] = useState(8)
  const [pacingGap, setPacingGap] = useState(0.1)

  const videoRef = useRef<HTMLVideoElement>(null)
  const engineRef = useRef<SpeechEngine | null>(null)
  const currentTimeRef = useRef(0)

  const currentSubtitle = subtitles.find(
    s => currentTime >= s.start && currentTime <= s.end + 0.3
  ) ?? null

  const handleTimeUpdate = (time: number) => {
    setCurrentTime(time)
    currentTimeRef.current = time
  }

  const handleFileSelect = (file: File) => {
    const url = URL.createObjectURL(file)
    setVideoUrl(url)
    setVideoFile(file)
    setSubtitles([])
    setInterimText('')
    setStatus('idle')
  }

  const handleStart = useCallback(() => {
    if (!videoRef.current) return
    videoRef.current.play()

    const engine = new SpeechEngine({
      language,
      wordsPerSegment,
      pacingGap,

      onStart: () => {
        setIsRecording(true)
        setStatus('● LIVE')
      },

      onInterim: (text) => setInterimText(text),

      onFinal: (segment: SpeechSegment) => {
        const newSub: Subtitle = {
          id: segment.id,
          index: 0,
          start: segment.start,
          end: segment.end,
          text: segment.text,
        }
        setSubtitles(prev =>
          [...prev, newSub]
            .sort((a, b) => a.start - b.start)
            .map((s, i) => ({ ...s, index: i + 1 }))
        )
        setInterimText('')
      },

      onError: (err) => {
        setStatus(`Error: ${err}`)
        setIsRecording(false)
      },

      onStop: () => {
        setIsRecording(false)
        setInterimText('')
        setStatus('done ✓')
      },
    })

    engine.setVideoTimeGetter(() => videoRef.current?.currentTime ?? 0)
    engineRef.current = engine
    engine.start(videoRef.current.currentTime)
  }, [language, wordsPerSegment, pacingGap])

  const handleStop = useCallback(() => {
    engineRef.current?.stop()
    videoRef.current?.pause()
  }, [])

  const handleReset = () => {
    handleStop()
    setVideoUrl(null)
    setVideoFile(null)
    setSubtitles([])
    setInterimText('')
    setStatus('idle')
    setIsRecording(false)
  }

  const handleEdit = (id: string, field: 'text' | 'start' | 'end', value: string | number) => {
    setSubtitles(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s))
  }

  const handleDelete = (id: string) => {
    setSubtitles(prev =>
      prev.filter(s => s.id !== id).map((s, i) => ({ ...s, index: i + 1 }))
    )
  }

  const handleAdd = (newSub: Subtitle) => {
    setSubtitles(prev => {
      const all = [...prev, newSub].sort((a, b) => a.start - b.start)
      return all.map((s, i) => ({ ...s, index: i + 1 }))
    })
  }

  const handleMerge = (id1: string, id2: string) => {
    setSubtitles(prev => {
      const a = prev.find(s => s.id === id1)
      const b = prev.find(s => s.id === id2)
      if (!a || !b) return prev
      const merged: Subtitle = {
        id: crypto.randomUUID(),
        index: 0,
        start: Math.min(a.start, b.start),
        end: Math.max(a.end, b.end),
        text: `${a.text} ${b.text}`,
      }
      return prev
        .filter(s => s.id !== id1 && s.id !== id2)
        .concat(merged)
        .sort((a, b) => a.start - b.start)
        .map((s, i) => ({ ...s, index: i + 1 }))
    })
  }

  const handleSplit = (id: string, text1: string, text2: string) => {
    setSubtitles(prev => {
      const orig = prev.find(s => s.id === id)
      if (!orig) return prev
      const mid = orig.start + (orig.end - orig.start) / 2
      const s1: Subtitle = {
        id: crypto.randomUUID(), index: 0,
        start: orig.start, end: mid, text: text1,
      }
      const s2: Subtitle = {
        id: crypto.randomUUID(), index: 0,
        start: mid, end: orig.end, text: text2,
      }
      return prev
        .filter(s => s.id !== id)
        .concat([s1, s2])
        .sort((a, b) => a.start - b.start)
        .map((s, i) => ({ ...s, index: i + 1 }))
    })
  }

  const tabs = [
    { id: 'subtitles' as RightTab, label: '🎙 Subs' },
    { id: 'customise' as RightTab, label: '🎨 Style' },
    { id: 'export'   as RightTab, label: '⬇ Export' },
    { id: 'preview'  as RightTab, label: '🎬 Preview' },
    { id: 'burn'     as RightTab, label: '🔥 Burn' },
  ]

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: '#0c0d0f',
      color: '#e8eaf0',
    }}>

      {/* ── Header ─────────────────────────────────── */}
      <header style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '14px 28px',
        borderBottom: '1px solid #272b36',
        background: '#13151a',
        flexShrink: 0,
      }}>
        <h1 style={{ fontSize: '20px', fontWeight: 800, letterSpacing: '-0.5px' }}>
          Subs<span style={{ color: '#e8a84c' }}>Craft</span>
        </h1>

        <span style={{
          fontSize: '10px',
          fontFamily: 'monospace',
          background: '#e8a84c',
          color: '#000',
          padding: '2px 8px',
          borderRadius: '99px',
          fontWeight: 600,
        }}>
          AI
        </span>

        {subtitles.length > 0 && (
          <span style={{
            fontSize: '11px',
            fontFamily: 'monospace',
            color: '#4ce8a8',
            background: 'rgba(76,232,168,0.1)',
            border: '1px solid rgba(76,232,168,0.2)',
            padding: '2px 10px',
            borderRadius: '99px',
          }}>
            {subtitles.length} segments ready
          </span>
        )}

        {isRecording && (
          <span style={{
            fontSize: '11px',
            fontFamily: 'monospace',
            color: '#e84c6b',
            background: 'rgba(232,76,107,0.1)',
            border: '1px solid rgba(232,76,107,0.3)',
            padding: '2px 10px',
            borderRadius: '99px',
            animation: 'pulse 1.5s infinite',
          }}>
            🔴 LIVE
          </span>
        )}

        <span style={{
          marginLeft: 'auto',
          fontSize: '11px',
          fontFamily: 'monospace',
          color: '#6b7080',
        }}>
          SubsCraft AI ✅
        </span>
      </header>

      {/* ── Main ───────────────────────────────────── */}
<main style={{
  display: 'flex',
  flex: 1,
  overflow: 'hidden',
  minHeight: 0,
}}>

  {/* ── PREVIEW FULL MODE ───────────────────── */}
  {activeTab === 'preview' && videoUrl && (
    <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>

      {/* Left — big preview player */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        minHeight: 0,
        borderRight: '1px solid #272b36',
      }}>
        <SyncPlayer
          videoUrl={videoUrl}
          subtitles={subtitles}
          style={style}
          onSubtitlesChange={setSubtitles}
        />
      </div>

      {/* Right — tab switcher stays */}
      <div style={{
        width: '60px',
        display: 'flex',
        flexDirection: 'column',
        background: '#13151a',
        borderLeft: '1px solid #272b36',
        alignItems: 'center',
        paddingTop: '8px',
        gap: '4px',
      }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            title={tab.label}
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '8px',
              border: `1px solid ${activeTab === tab.id ? '#e8a84c' : 'transparent'}`,
              background: activeTab === tab.id ? 'rgba(232,168,76,0.1)' : 'none',
              color: activeTab === tab.id ? '#e8a84c' : '#6b7080',
              cursor: 'pointer',
              fontSize: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s',
            }}
          >
            {tab.label.split(' ')[0]}
          </button>
        ))}
      </div>
    </div>
  )}

  {/* ── NORMAL MODE (all other tabs) ─────────── */}
  {activeTab !== 'preview' && (
    <>
      {/* Left Panel */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        padding: '20px 24px',
        gap: '12px',
        borderRight: '1px solid #272b36',
        overflow: 'hidden',
        minHeight: 0,
      }}>
        {!videoUrl ? (
          <UploadZone onFileSelect={handleFileSelect} />
        ) : (
          <>
            <VideoPlayer
              videoUrl={videoUrl}
              currentSubtitle={currentSubtitle}
              currentTime={currentTime}
              style={style}
              onTimeUpdate={handleTimeUpdate}
              onPositionChange={(x, y) =>
                setStyle(prev => ({ ...prev, x, y, position: 'custom' }))
              }
              videoRef={videoRef}
            />

            <ControlBar
              isRecording={isRecording}
              hasSubtitles={subtitles.length > 0}
              status={status}
              language={language}
              wordsPerSegment={wordsPerSegment}
              pacingGap={pacingGap}
              onStart={handleStart}
              onStop={handleStop}
              onClear={() => { setSubtitles([]); setInterimText('') }}
              onNewFile={handleReset}
              onLanguageChange={setLanguage}
              onWordsPerSegmentChange={setWordsPerSegment}
              onPacingGapChange={setPacingGap}
            />

            {!isRecording && subtitles.length === 0 && (
              <p style={{
                fontSize: '11px',
                fontFamily: 'monospace',
                color: '#6b7080',
                background: 'rgba(232,168,76,0.05)',
                border: '1px solid rgba(232,168,76,0.1)',
                borderRadius: '8px',
                padding: '8px 14px',
                lineHeight: 1.6,
              }}>
                💡 Set your words/segment → Select language →{' '}
                <strong style={{ color: '#e8a84c' }}>Start Subtitling</strong> →
                Play video with volume on!
              </p>
            )}

            {subtitles.length > 0 && !isRecording && (
              <p style={{
                fontSize: '11px',
                fontFamily: 'monospace',
                color: '#4ce8a8',
                background: 'rgba(76,232,168,0.05)',
                border: '1px solid rgba(76,232,168,0.1)',
                borderRadius: '8px',
                padding: '8px 14px',
              }}>
                ✅ {subtitles.length} segments ready! Go to{' '}
                <strong
                  style={{ color: '#e8a84c', cursor: 'pointer', textDecoration: 'underline' }}
                  onClick={() => setActiveTab('preview')}
                >
                  🎬 Preview
                </strong>{' '}
                to sync, or{' '}
                <strong
                  style={{ color: '#4c8ee8', cursor: 'pointer', textDecoration: 'underline' }}
                  onClick={() => setActiveTab('export')}
                >
                  ⬇ Export
                </strong>.
              </p>
            )}
          </>
        )}
      </div>

      {/* Right Panel */}
      <div style={{
        width: '400px',
        display: 'flex',
        flexDirection: 'column',
        background: '#13151a',
        overflow: 'hidden',
        minHeight: 0,
      }}>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid #272b36',
          flexShrink: 0,
        }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1,
                padding: '11px 4px',
                fontSize: '10px',
                fontWeight: 700,
                letterSpacing: '0.3px',
                textTransform: 'uppercase',
                cursor: 'pointer',
                border: 'none',
                borderBottom: `2px solid ${activeTab === tab.id ? '#e8a84c' : 'transparent'}`,
                background: 'none',
                color: activeTab === tab.id ? '#e8a84c' : '#6b7080',
                fontFamily: 'inherit',
                transition: 'all 0.15s',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Subtitle count row */}
        {activeTab === 'subtitles' && (
          <div style={{
            padding: '8px 18px',
            borderBottom: '1px solid #272b36',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexShrink: 0,
          }}>
            <span style={{ fontSize: '11px', fontFamily: 'monospace', color: '#e8a84c' }}>
              {subtitles.length} segment{subtitles.length !== 1 ? 's' : ''}
            </span>
            {wordsPerSegment === 1 && (
              <span style={{ fontSize: '10px', fontFamily: 'monospace', color: '#4c8ee8', background: 'rgba(76,142,232,0.1)', padding: '2px 8px', borderRadius: '99px' }}>
                ⚡ Word mode
              </span>
            )}
          </div>
        )}

        {/* Tab content */}
        <div style={{
          flex: 1,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}>
          {activeTab === 'subtitles' && (
            <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <SubtitleList
                subtitles={subtitles}
                currentTime={currentTime}
                interimText={interimText}
                isRecording={isRecording}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onSeek={time => { if (videoRef.current) videoRef.current.currentTime = time }}
                onAdd={handleAdd}
                onReorder={reordered => setSubtitles(reordered)}
                onMerge={handleMerge}
                onSplit={handleSplit}
              />
            </div>
          )}

          {activeTab === 'customise' && (
            <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
              <CustomisePanel style={style} onChange={setStyle} />
            </div>
          )}

          {activeTab === 'export' && (
            <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
              <ExportPanel subtitles={subtitles} videoFileName={videoFile?.name} />
            </div>
          )}

          {activeTab === 'burn' && (
            <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
              <BurnPanel subtitles={subtitles} videoFile={videoFile} style={style} />
            </div>
          )}
        </div>
      </div>
    </>
  )}

</main>


      {/* Email Capture Popup */}
      <EmailCapture
        trigger="auto"
        delay={45000}
        subtitleCount={subtitles.length}
      />

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.6} }
      `}</style>
    </div>
  )
}