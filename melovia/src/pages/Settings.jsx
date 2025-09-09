import { useEffect, useState } from 'react'

const DEFAULTS = {
  theme: 'dark',
  quality: 'high',
  crossfade: 0,
  autoplay: true
}

export default function Settings() {
  const [prefs, setPrefs] = useState(DEFAULTS)

  useEffect(() => {
    const saved = localStorage.getItem('melovia:prefs')
    if (saved) setPrefs(JSON.parse(saved))
  }, [])

  useEffect(() => {
    localStorage.setItem('melovia:prefs', JSON.stringify(prefs))
  }, [prefs])

  return (
    <section>
      <h2>Settings</h2>

      <div className="settings-grid">
        <label>
          Theme
          <select
            value={prefs.theme}
            onChange={e => setPrefs(p => ({ ...p, theme: e.target.value }))}
          >
            <option value="dark">Dark</option>
            <option value="light">Light</option>
          </select>
        </label>

        <label>
          Quality
          <select
            value={prefs.quality}
            onChange={e => setPrefs(p => ({ ...p, quality: e.target.value }))}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </label>

        <label>
          Crossfade (s)
          <input
            type="number"
            min="0"
            max="10"
            value={prefs.crossfade}
            onChange={e => setPrefs(p => ({ ...p, crossfade: Number(e.target.value) }))}
          />
        </label>

        <label className="row">
          <input
            type="checkbox"
            checked={prefs.autoplay}
            onChange={e => setPrefs(p => ({ ...p, autoplay: e.target.checked }))}
          />
          Autoplay next track
        </label>
      </div>
    </section>
  )
}
