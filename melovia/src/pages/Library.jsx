import { useEffect, useState } from 'react'

export default function Library() {
  const [tracks, setTracks] = useState([])

  useEffect(() => {
    // TODO: Replace with Firebase/your API
    setTracks([
      { id: 1, title: 'Endless in July', artist: 'PONGRA', url: '/demo/endless-in-july.mp3' },
      { id: 2, title: 'Night Drive', artist: 'PONGRA', url: '/demo/night-drive.mp3' }
    ])
  }, [])

  return (
    <section>
      <h2>Your Library</h2>
      <ul className="track-list">
        {tracks.map(t => (
          <li key={t.id}>
            <div className="track-title">{t.title}</div>
            <div className="track-artist">{t.artist}</div>
            <button data-url={t.url} className="play-btn">Play</button>
          </li>
        ))}
      </ul>
    </section>
  )
}
