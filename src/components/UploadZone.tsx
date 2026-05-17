'use client'

import { useRef, useState } from 'react'

interface UploadZoneProps {
  onFileSelect: (file: File) => void
}

export default function UploadZone({ onFileSelect }: UploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  const handleFile = (file: File) => {
    if (file.type.startsWith('video/')) {
      onFileSelect(file)
    } else {
      alert('Please upload a video file!')
    }
  }

  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault()
        setDragging(false)
        const file = e.dataTransfer.files[0]
        if (file) handleFile(file)
      }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '16px',
        width: '100%',
        flex: 1,
        minHeight: '400px',
        borderRadius: '16px',
        cursor: 'pointer',
        border: `2px dashed ${dragging ? '#e8a84c' : '#272b36'}`,
        background: dragging ? 'rgba(232,168,76,0.05)' : 'transparent',
        transition: 'all 0.2s',
        position: 'relative',
      }}
    >
      {/* Icon */}
      <div style={{ fontSize: '56px', opacity: 0.5 }}>🎬</div>

      {/* Text */}
      <div style={{ textAlign: 'center' }}>
        <p style={{ fontSize: '20px', fontWeight: 700, color: '#e8eaf0', marginBottom: '6px' }}>
          Drop your video here
        </p>
        <p style={{ fontSize: '12px', color: '#6b7080', fontFamily: 'monospace' }}>
          MP4 · WebM · MOV · AVI
        </p>
      </div>

      {/* Button */}
      <button
        onClick={(e) => { e.stopPropagation(); inputRef.current?.click() }}
        style={{
          marginTop: '8px',
          padding: '10px 28px',
          background: '#e8a84c',
          color: '#000',
          fontWeight: 700,
          fontSize: '14px',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          fontFamily: 'inherit',
        }}
      >
        Choose File
      </button>

      <p style={{ fontSize: '11px', color: '#6b7080', fontFamily: 'monospace' }}>
        or drag & drop anywhere
      </p>

      <input
        ref={inputRef}
        type="file"
        accept="video/*"
        style={{ display: 'none' }}
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleFile(file)
        }}
      />
    </div>
  )
}