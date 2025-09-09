import { useEffect, useRef, useState } from 'react'
import { Howl } from 'howler'

export default function PlayerBar() {
  const [title, setTitle] = useState('\u2013')
  const [artist, setArtist] = useState('\u2013')
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const howlRef = useRef(null)
  const rafRef = useRef(0)

  function load(url, meta = {}) {
    if (howlRef.current) howlRef.current.unload()
    const sound = new Howl({ src: [url], html5: true })
    howlRef.current = sound
    setTitle(meta.title ?? 'Unknown')
    setArtist(meta.artist ?? 'Unknown')

    sound.once('load', () => {
      sound.play()
      setIsPlaying(true)
      tick()
    })
    sound.on('end', () => {
      setIsPlaying(false)
      cancelAnimationFrame(rafRef.current)
    })
  }

  function tick() {
    const s = howlRef.current
    if (!s) return
    const ratio = s.seek() / s.duration()
    setProgress(isFinite(ratio) ? ratio : 0)
    rafRef.current = requestAnimationFrame(tick)
  }

  useEffect(() => {
    const handler = (e) => {
      const btn = e.target.closest('.play-btn')
      if (!btn) return
      const url = btn.getAttribute('data-url')
      const item = btn.closest('li')
      const title = item?.querySelector('.track-title')?.textContent ?? 'Unknown'
      const artist = item?.querySelector('.track-artist')?.textContent ?? 'Unknown'
      load(url, { title, artist })
    }
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [])

  return (
    <footer className="playerbar">
      <div className="meta">
        <div className="title">{title}</div>
        <div className="artist">{artist}</div>
      </div>

      <div className="controls">
        <button
          onClick={() => {
            const s = howlRef.current
            if (!s) return
            if (s.playing()) {
              s.pause()
              setIsPlaying(false)
            } else {
              s.play()
              setIsPlaying(true)
              tick()
            }
          }}
        >
          {isPlaying ? 'Pause' : 'Play'}
        </button>
        <div className="progress">
          <div className="bar" style={{ width: `${progress * 100}%` }} />
        </div>
      </div>
    </footer>
  )
}
