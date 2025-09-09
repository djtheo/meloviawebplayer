import { NavLink, Routes, Route } from 'react-router-dom'
import Home from './pages/Home.jsx'
import Library from './pages/Library.jsx'
import Settings from './pages/Settings.jsx'
import PlayerBar from './components/PlayerBar.jsx'

export default function App() {
  return (
    <div className="app">
      <aside className="sidebar">
        <h1 className="brand">Melovia</h1>
        <nav>
          <NavLink to="/" end>Home</NavLink>
          <NavLink to="/library">Library</NavLink>
          <NavLink to="/settings">Settings</NavLink>
        </nav>
      </aside>

      <main className="content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/library" element={<Library />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </main>

      <PlayerBar />
    </div>
  )
}
