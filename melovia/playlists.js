/*
 * Playlist management logic.
 *
 * This script enables users to create, view, edit and delete playlists. Each
 * playlist contains a name and an array of song IDs referencing the songs
 * stored in localStorage by script.js. Playlists themselves are stored in
 * localStorage under the key 'playlists'. When editing a playlist, a list
 * of available songs is presented with checkboxes for inclusion. Changes are
 * saved back to localStorage. The UI is rebuilt whenever playlists are
 * modified.
 */

/**
 * Retrieve the saved songs from localStorage or fallback to defaults. This
 * mirrors the logic in script.js but does not import the module directly.
 *
 * @returns {Array} Array of song objects
 */
function getSongs() {
  try {
    const stored = localStorage.getItem('songs');
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    return [];
  }
}

/**
 * Load playlists from localStorage. Returns an empty array if none exist.
 *
 * @returns {Array} Array of playlist objects
 */
function loadPlaylists() {
  try {
    const stored = localStorage.getItem('playlists');
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    return [];
  }
}

/**
 * Save playlists to localStorage.
 *
 * @param {Array} playlists Array of playlist objects
 */
function savePlaylists(playlists) {
  try {
    localStorage.setItem('playlists', JSON.stringify(playlists));
  } catch (e) {
    console.warn('Could not save playlists to localStorage', e);
  }
}

// References to DOM elements
const playlistListEl = document.getElementById('playlist-list');
const newNameInput = document.getElementById('new-playlist-name');
const createBtn = document.getElementById('create-playlist-btn');
const editorContainer = document.getElementById('playlist-editor');
const editorTitle = document.getElementById('editor-title');
const songSelection = document.getElementById('song-selection');
const saveBtn = document.getElementById('save-playlist-btn');
const cancelBtn = document.getElementById('cancel-edit-btn');

// Tracks which playlist is currently being edited (index in playlists array)
let currentEditIndex = null;

/**
 * Render the list of playlists in the UI. Each item shows the playlist
 * name and song count, along with Edit and Delete buttons.
 */
function renderPlaylists() {
  const playlists = loadPlaylists();
  playlistListEl.innerHTML = '';
  if (!playlists.length) {
    const li = document.createElement('li');
    li.textContent = 'No playlists created yet.';
    playlistListEl.appendChild(li);
    return;
  }
  playlists.forEach((pl, idx) => {
    const li = document.createElement('li');
    const nameSpan = document.createElement('span');
    nameSpan.className = 'playlist-name';
    nameSpan.textContent = `${pl.name} (${pl.songs.length})`;
    li.appendChild(nameSpan);
    // Edit button
    const editBtn = document.createElement('button');
    editBtn.textContent = 'Edit';
    editBtn.addEventListener('click', () => startEditPlaylist(idx));
    li.appendChild(editBtn);
    // Delete button
    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = 'Delete';
    deleteBtn.addEventListener('click', () => deletePlaylist(idx));
    li.appendChild(deleteBtn);
    // View button
    const viewBtn = document.createElement('button');
    viewBtn.textContent = 'View';
    viewBtn.addEventListener('click', () => viewPlaylist(idx));
    li.appendChild(viewBtn);
      // Play button
      const playBtn = document.createElement('button');
      playBtn.textContent = 'Play';
      playBtn.addEventListener('click', () => {
        // Construct queue of indices for this playlist
        const allSongs = getSongs();
        const queueIndices = [];
        pl.songs.forEach((id) => {
          const songIndex = allSongs.findIndex((s) => s.id === id);
          if (songIndex !== -1) queueIndices.push(songIndex);
        });
        if (queueIndices.length) {
          try {
            playPlaylist(queueIndices);
          } catch (e) {
            console.warn('Failed to start playlist playback', e);
          }
        } else {
          alert('This playlist has no songs to play.');
        }
      });
      li.appendChild(playBtn);
    playlistListEl.appendChild(li);
  });
}

/**
 * Display the songs in a playlist and allow playback. Builds a list of
 * song titles that can be clicked to play via the global player
 * provided by script.js. If the playlist has no songs, a message is shown.
 *
 * @param {number} index Index of the playlist in the playlists array
 */
function viewPlaylist(index) {
  const playlists = loadPlaylists();
  const pl = playlists[index];
  const viewer = document.getElementById('playlist-viewer');
  if (!viewer) return;
  viewer.innerHTML = '';
  const header = document.createElement('h3');
  header.textContent = `Playlist: ${pl.name}`;
  viewer.appendChild(header);
  // Play all button for this playlist
  const playAllBtn = document.createElement('button');
  playAllBtn.textContent = 'Play All';
  playAllBtn.style.marginBottom = '10px';
  playAllBtn.addEventListener('click', () => {
    // Build queue indices for this playlist
    const allSongs = getSongs();
    const queueIndices = [];
    pl.songs.forEach((id) => {
      const idx = allSongs.findIndex((s) => s.id === id);
      if (idx !== -1) queueIndices.push(idx);
    });
    if (queueIndices.length) {
      try {
        playPlaylist(queueIndices);
      } catch (e) {
        console.warn('Failed to start playlist playback', e);
      }
    } else {
      alert('This playlist has no songs to play.');
    }
  });
  viewer.appendChild(playAllBtn);
  if (!pl.songs || !pl.songs.length) {
    const p = document.createElement('p');
    p.textContent = 'This playlist has no songs. Use the Edit option to add some.';
    viewer.appendChild(p);
    return;
  }
  const ul = document.createElement('ul');
  ul.style.listStyle = 'none';
  ul.style.padding = '0';
  const allSongs = getSongs();
  pl.songs.forEach((songId) => {
    const songObj = allSongs.find((s) => s.id === songId);
    if (!songObj) return;
    const li = document.createElement('li');
    li.className = 'playlist-song-item';
    li.textContent = `${songObj.title} — ${songObj.artist}`;
    li.style.cursor = 'pointer';
    li.style.padding = '8px 0';
    li.style.color = 'var(--text-primary)';
    // On click, load and play the song using global functions from script.js
    li.addEventListener('click', () => {
      try {
        // Determine the index of this song in the global songs array used by script.js
        if (typeof songs !== 'undefined') {
          const idx = songs.findIndex((s) => s.id === songObj.id);
          if (idx !== -1) {
            loadSong(idx);
            playSong();
          }
        }
      } catch (e) {
        console.warn('Playback failed', e);
      }
    });
    ul.appendChild(li);
  });
  viewer.appendChild(ul);
}

/**
 * Create a new playlist using the name entered by the user. If the name
 * field is empty, an alert is shown. Upon successful creation, the list
 * is refreshed.
 */
function createPlaylist() {
  const name = (newNameInput.value || '').trim();
  if (!name) {
    alert('Please enter a playlist name.');
    return;
  }
  const playlists = loadPlaylists();
  // Ensure name is unique to avoid confusion
  const duplicate = playlists.find((pl) => pl.name.toLowerCase() === name.toLowerCase());
  if (duplicate) {
    alert('A playlist with that name already exists. Please choose another name.');
    return;
  }
  playlists.push({ name: name, songs: [] });
  savePlaylists(playlists);
  newNameInput.value = '';
  renderPlaylists();
}

/**
 * Delete a playlist by its index. Prompts for confirmation before removal.
 *
 * @param {number} index Index of the playlist to delete
 */
function deletePlaylist(index) {
  const playlists = loadPlaylists();
  const pl = playlists[index];
  if (confirm(`Delete playlist "${pl.name}"? This cannot be undone.`)) {
    playlists.splice(index, 1);
    savePlaylists(playlists);
    renderPlaylists();
    // If currently editing this playlist, close the editor
    if (currentEditIndex === index) {
      closeEditor();
    }
  }
}

/**
 * Begin editing a playlist. Displays the editor section and populates
 * it with checkboxes for all available songs. Selected checkboxes
 * correspond to songs already in the playlist.
 *
 * @param {number} index Index of the playlist in the array
 */
function startEditPlaylist(index) {
  const playlists = loadPlaylists();
  currentEditIndex = index;
  const pl = playlists[index];
  editorTitle.textContent = `Edit Playlist: ${pl.name}`;
  // Build song selection list
  songSelection.innerHTML = '';
  const allSongs = getSongs();
  allSongs.forEach((song) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'song-option';
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.value = song.id;
    checkbox.checked = pl.songs.includes(song.id);
    const label = document.createElement('label');
    label.textContent = `${song.title} — ${song.artist}`;
    wrapper.appendChild(checkbox);
    wrapper.appendChild(label);
    songSelection.appendChild(wrapper);
  });
  editorContainer.style.display = 'block';
}

/**
 * Save the current playlist edits. Reads the selected song IDs from
 * checkboxes and updates the playlist's songs array. Then writes the
 * updated playlists back to localStorage and refreshes the list.
 */
function savePlaylistEdits() {
  if (currentEditIndex === null) return;
  const playlists = loadPlaylists();
  const pl = playlists[currentEditIndex];
  const checkboxes = songSelection.querySelectorAll('input[type="checkbox"]');
  const selectedIds = [];
  checkboxes.forEach((cb) => {
    if (cb.checked) selectedIds.push(parseInt(cb.value));
  });
  pl.songs = selectedIds;
  savePlaylists(playlists);
  renderPlaylists();
  closeEditor();
}

/**
 * Close the playlist editor and reset state.
 */
function closeEditor() {
  editorContainer.style.display = 'none';
  songSelection.innerHTML = '';
  currentEditIndex = null;
}

/**
 * Initialise playlist management on DOM content loaded. Sets up
 * event listeners and renders the existing playlists.
 */
function initPlaylists() {
  renderPlaylists();
  createBtn.addEventListener('click', createPlaylist);
  saveBtn.addEventListener('click', savePlaylistEdits);
  cancelBtn.addEventListener('click', closeEditor);
}

document.addEventListener('DOMContentLoaded', initPlaylists);