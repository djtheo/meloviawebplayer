/*
 * Vanilla JavaScript implementation of a simple music streaming interface.
 *
 * This script populates a library list, handles audio playback with
 * play/pause controls, previous/next track navigation, and displays
 * a progress bar with time indicators. The music data lives in the
 * `songs` array—feel free to extend or replace these entries with
 * your own streaming sources.
 */

// Default songs used when no saved songs exist in localStorage.  Previously
// these entries pointed to SoundHelix demo tracks, but per user request we
// now start with an empty list. Users can upload their own audio files via
// the file input on the home page.
const defaultSongs = [];

// Load songs from localStorage if available; otherwise use default songs.
let songs;
try {
  const stored = localStorage.getItem('songs');
  if (stored) {
    songs = JSON.parse(stored);
  } else {
    songs = defaultSongs.slice();
  }
} catch (e) {
  songs = defaultSongs.slice();
}

// Remove any songs sourced from SoundHelix. We check both the URL and
// the artist name so that previously saved SoundHelix tracks are
// permanently excluded. After filtering, persist the cleaned list.
if (Array.isArray(songs)) {
  const originalLength = songs.length;
  songs = songs.filter((song) => {
    if (!song) return false;
    const url = song.url || '';
    const artist = (song.artist || '').toLowerCase();
    return !/soundhelix\.com/i.test(url) && artist !== 'soundhelix';
  });
  if (songs.length !== originalLength) {
    // Persist the filtered list back to localStorage
    saveSongs();
  }
}

/**
 * Persist the current songs array to localStorage. Called after
 * modifications such as uploads.
 */
function saveSongs() {
  try {
    localStorage.setItem('songs', JSON.stringify(songs));
  } catch (e) {
    console.warn('Could not save songs to localStorage', e);
  }
}

// Track the state of the player
let currentSongIndex = 0;
let isPlaying = false;

// Additional playback modes
// When shuffle is enabled, the next song is chosen randomly.
let isShuffle = false;
// Loop mode: 0 = no loop, 1 = loop current song
let loopMode = 0;
// Queue for playlist playback (array of song indices). When set, next/prev
// navigation will operate within this queue instead of the full songs list.
let currentQueue = null;
// Position within the current queue
let queuePosition = 0;
// Controls album art visibility
let albumArtVisible = true;

// Elements for the album popup that shows a larger cover and song info. These
// will be assigned in init() once the DOM has loaded. The popup is
// toggled via the album art button in the player bar and displays on
// the right side of the screen.
let albumPopup;
let popupAlbumArt;
let popupSongTitle;
let popupSongArtist;

// Keep track of search query for filtering the trending grid
let currentSearchQuery = '';

// Load favourites and recently played lists from localStorage
let favorites = [];
let recentlyPlayed = [];

/**
 * Load persisted favourites and recently played lists from localStorage.
 */
function loadUserLists() {
  try {
    const favData = localStorage.getItem('favorites');
    if (favData) {
      favorites = JSON.parse(favData);
    }
  } catch (e) {
    console.warn('Failed to load favourites', e);
  }
  try {
    const recentData = localStorage.getItem('recentlyPlayed');
    if (recentData) {
      recentlyPlayed = JSON.parse(recentData);
    }
  } catch (e) {
    console.warn('Failed to load recently played list', e);
  }

  // After loading favourites and recently played, remove any entries that
  // refer to songs that no longer exist (e.g. removed SoundHelix tracks).
  try {
    if (Array.isArray(favorites) && Array.isArray(songs)) {
      const validIds = new Set(songs.map((s) => s.id));
      const favLen = favorites.length;
      favorites = favorites.filter((id) => validIds.has(id));
      if (favorites.length !== favLen) saveFavorites();
    }
    if (Array.isArray(recentlyPlayed) && Array.isArray(songs)) {
      const validIds = new Set(songs.map((s) => s.id));
      const recentLen = recentlyPlayed.length;
      recentlyPlayed = recentlyPlayed.filter((song) => song && validIds.has(song.id));
      if (recentlyPlayed.length !== recentLen) saveRecentlyPlayed();
    }
  } catch (e) {
    // ignore
  }
}

/**
 * Save favourites to localStorage.
 */
function saveFavorites() {
  try {
    localStorage.setItem('favorites', JSON.stringify(favorites));
  } catch (e) {
    console.warn('Failed to save favourites', e);
  }
}

/**
 * Save recently played list to localStorage.
 */
function saveRecentlyPlayed() {
  try {
    localStorage.setItem('recentlyPlayed', JSON.stringify(recentlyPlayed));
  } catch (e) {
    console.warn('Failed to save recently played list', e);
  }
}

/**
 * Determine whether a song is in the favourites list.
 * @param {number} id Song ID
 * @returns {boolean}
 */
function isFavorite(id) {
  return favorites.includes(id);
}

/**
 * Toggle favourite state for a given song ID. Adds the song to favourites
 * if it's not already present; otherwise removes it. After updating the
 * list, the favourites are persisted and the grid is re-rendered.
 * @param {number} id
 */
function toggleFavorite(id) {
  const index = favorites.indexOf(id);
  if (index === -1) {
    favorites.push(id);
  } else {
    favorites.splice(index, 1);
  }
  saveFavorites();
  // Re-render trending grid using current search query
  renderTrendingGrid(getFilteredSongs());

  // If the current page contains a liked songs container, update the list
  const likedContainer = document.getElementById('liked-container');
  if (likedContainer) {
    renderLikedSongs();
  }
}

/**
 * Add a song to the recently played list. Only unique songs are kept.
 * The most recently played song appears first. The list is capped
 * at a maximum of 6 items.
 * @param {Object} song
 */
function updateRecentlyPlayed(song) {
  // Remove if already present
  recentlyPlayed = recentlyPlayed.filter((s) => s.id !== song.id);
  // Add to front
  recentlyPlayed.unshift(song);
  // Limit to 6 items
  if (recentlyPlayed.length > 6) {
    recentlyPlayed.pop();
  }
  saveRecentlyPlayed();
  renderRecentlyPlayed();
}

/**
 * Render the recently played row on the home page.
 */
function renderRecentlyPlayed() {
  const container = document.getElementById('recently-played-row');
  if (!container) return;
  container.innerHTML = '';
  recentlyPlayed.forEach((song) => {
    const card = document.createElement('div');
    card.className = 'recently-card';
    const img = document.createElement('img');
    img.src = song.coverUrl || 'assets/album_art.png';
    card.appendChild(img);
    const titleEl = document.createElement('p');
    titleEl.textContent = song.title;
    card.appendChild(titleEl);
    // Clicking a recently played song loads and plays it
    card.addEventListener('click', () => {
      const index = songs.findIndex((s) => s.id === song.id);
      if (index !== -1) {
        loadSong(index);
        playSong();
      }
    });
    container.appendChild(card);
  });
}

/**
 * Render the list of liked songs on the liked songs page. This function
 * looks up the container with id `liked-container` and populates it
 * with cards for each song that appears in the favourites list. Each
 * card shows the album art, title and artist, includes a heart icon
 * for toggling the favourite state, and allows clicking to play the
 * song. If there are no liked songs, a friendly message is shown.
 */
function renderLikedSongs() {
  const container = document.getElementById('liked-container');
  if (!container) return;
  container.innerHTML = '';
  // Remove any previous grid class to start fresh
  container.classList.remove('trending-grid');
  // First, gather the favourite songs
  let favSongs = songs.filter((s) => favorites.includes(s.id));
  // Apply search filtering if a query is present
  const query = (currentSearchQuery || '').toLowerCase().trim();
  if (query) {
    favSongs = favSongs.filter((song) =>
      song.title.toLowerCase().includes(query) ||
      song.artist.toLowerCase().includes(query)
    );
  }
  if (favSongs.length === 0) {
    const msg = document.createElement('p');
    msg.textContent = "You haven't liked any songs yet.";
    // Apply theme colour to the message text
    msg.style.color = getComputedStyle(document.documentElement).getPropertyValue('--text-primary');
    container.appendChild(msg);
    return;
  }
  // Use a flexbox grid similar to trending songs
  container.classList.add('trending-grid');
  favSongs.forEach((song) => {
    const card = document.createElement('div');
    card.className = 'trending-card';
    // Album art
    const img = document.createElement('img');
    img.src = song.coverUrl || 'assets/album_art.png';
    card.appendChild(img);
    // Favourite icon
    const favIcon = document.createElement('div');
    favIcon.className = 'favorite-icon';
    favIcon.textContent = isFavorite(song.id) ? '♥' : '♡';
    if (isFavorite(song.id)) favIcon.classList.add('favorited');
    favIcon.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleFavorite(song.id);
    });
    card.appendChild(favIcon);
    // Info container
    const info = document.createElement('div');
    info.className = 'card-info';
    const titleEl = document.createElement('h4');
    titleEl.textContent = song.title;
    info.appendChild(titleEl);
    const artistEl = document.createElement('p');
    artistEl.textContent = song.artist;
    info.appendChild(artistEl);
    card.appendChild(info);
    // Click handler to play
    card.addEventListener('click', () => {
      const idx = songs.findIndex((s) => s.id === song.id);
      if (idx !== -1) {
        loadSong(idx);
        playSong();
      }
    });
    container.appendChild(card);
  });
}

/**
 * Get a filtered list of songs based on the current search query.
 * If no query is set, returns the full songs array.
 * @returns {Array}
 */
function getFilteredSongs() {
  const query = currentSearchQuery.trim().toLowerCase();
  if (!query) return songs;
  return songs.filter((song) => {
    return (
      song.title.toLowerCase().includes(query) ||
      song.artist.toLowerCase().includes(query)
    );
  });
}

// References to DOM elements
const songListContainer = document.getElementById('song-list');
const songTitleEl = document.getElementById('song-title');
const songArtistEl = document.getElementById('song-artist');
const playPauseBtn = document.getElementById('play-pause-btn');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const progressRange = document.getElementById('progress-range');
const currentTimeEl = document.getElementById('current-time');
const durationEl = document.getElementById('duration');
const audio = document.getElementById('audio');
// Volume control element (only on the home page)
const volumeRange = document.getElementById('volume-range');

// Additional control references for shuffle, loop and album toggle
const shuffleBtn = document.getElementById('shuffle-btn');
const loopBtn = document.getElementById('loop-btn');
const toggleAlbumBtn = document.getElementById('toggle-album-btn');
const albumArtEl = document.getElementById('player-album-art');

// Pop-up elements for displaying a larger album cover and song info
// These elements are declared at the top of the file and assigned in
// init(). Do not redeclare them here.

// Elements for trending songs and artists (only exist on the home page)
const trendingGrid = document.getElementById('trending-grid');
const artistsRow = document.getElementById('artists-row');

// File input for uploading custom songs (only exists on the home page)
const fileInput = document.getElementById('file-input');

/**
 * Handle audio file uploads. Allows users to select one or more local
 * audio files which will then be added to the library. Each file is
 * read as a Base64 data URL so that it can be stored persistently in
 * localStorage. The title of the song is derived from the filename
 * (without its extension) and the artist is set to "Unknown" by
 * default. After all files are processed the songs array is updated,
 * saved and the song list re-rendered.
 *
 * @param {Event} event The change event from the file input
 */
function handleFileUpload(event) {
  const files = Array.from(event.target.files || []);
  if (!files.length) return;
  // Determine the starting ID for new songs by taking the max existing ID
  const currentMaxId = songs.reduce((max, s) => (s.id > max ? s.id : max), 0);
  let nextId = currentMaxId + 1;
  const readPromises = files.map((file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target.result;
        const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
        resolve({
          id: nextId++,
          title: nameWithoutExt || `Untitled ${nextId}`,
          artist: 'Unknown',
          url: dataUrl,
        coverUrl: 'assets/album_art.png',
        });
      };
      // Read the file as a DataURL (Base64 encoded) so it can be persisted
      reader.readAsDataURL(file);
    });
  });
  Promise.all(readPromises).then((newSongs) => {
    songs = songs.concat(newSongs);
    saveSongs();
    // Clear the file input so selecting the same files again will trigger change
    event.target.value = '';
    renderSongList();
    renderTrendingGrid();
    renderArtistsRow();
  });
}

/**
 * Populate the song list in the library section. Attaches click
 * handlers to each item for selecting a track. The currently
 * playing song is highlighted by toggling the `active` class.
 */
function renderSongList() {
  // Clear existing items
  songListContainer.innerHTML = '';
  songs.forEach((song, index) => {
    const item = document.createElement('div');
    item.className = 'song-item' + (index === currentSongIndex ? ' active' : '');
    // Title
    const titleSpan = document.createElement('span');
    titleSpan.className = 'song-title';
    titleSpan.textContent = song.title;
    item.appendChild(titleSpan);
    // Artist
    const artistSpan = document.createElement('span');
    artistSpan.className = 'song-artist';
    artistSpan.textContent = song.artist;
    item.appendChild(artistSpan);
    // Click handler to load and play the selected track
    item.addEventListener('click', () => {
      loadSong(index);
      playSong();
    });
    songListContainer.appendChild(item);
  });
}

/**
 * Populate the trending songs grid on the home page. Creates
 * clickable cards for each song that display cover art, title
 * and artist. Clicking a card loads and plays the corresponding
 * track. If the trending grid container is not present (e.g., on
 * other pages), this function does nothing.
 */
function renderTrendingGrid(list) {
  if (!trendingGrid) return;
  trendingGrid.innerHTML = '';
  const toRender = list || getFilteredSongs();
  // If there are no songs to display, show a friendly message
  if (!toRender || toRender.length === 0) {
    const msg = document.createElement('p');
    msg.textContent = 'No songs available. Use the upload button in the sidebar to add your own tracks.';
    msg.style.color = getComputedStyle(document.documentElement).getPropertyValue('--text-secondary');
    msg.style.margin = '20px 0';
    trendingGrid.appendChild(msg);
    return;
  }
  toRender.forEach((song, index) => {
    const card = document.createElement('div');
    card.className = 'trending-card';
    // Album art image
    const img = document.createElement('img');
    img.src = song.coverUrl || 'assets/album_art.png';
    card.appendChild(img);
    // Favourite heart icon
    const favIcon = document.createElement('div');
    favIcon.className = 'favorite-icon';
    favIcon.textContent = isFavorite(song.id) ? '♥' : '♡';
    if (isFavorite(song.id)) favIcon.classList.add('favorited');
    favIcon.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleFavorite(song.id);
    });
    card.appendChild(favIcon);
    // Info container
    const info = document.createElement('div');
    info.className = 'card-info';
    const titleEl = document.createElement('h4');
    titleEl.textContent = song.title;
    info.appendChild(titleEl);
    const artistEl = document.createElement('p');
    artistEl.textContent = song.artist;
    info.appendChild(artistEl);
    card.appendChild(info);
    // Click handler to play song
    card.addEventListener('click', () => {
      const songIndex = songs.findIndex((s) => s.id === song.id);
      if (songIndex !== -1) {
        loadSong(songIndex);
        playSong();
      }
    });
    trendingGrid.appendChild(card);
  });
}

/**
 * Populate the artists row on the home page. Generates a list
 * of unique artists from the songs array and displays an avatar
 * and name for each. The avatar uses a placeholder image. This
 * function does nothing if the artists row container is absent.
 */
function renderArtistsRow() {
  if (!artistsRow) return;
  artistsRow.innerHTML = '';
  // Deduplicate artist names
  const uniqueArtists = Array.from(new Set(songs.map((s) => s.artist)));
  uniqueArtists.forEach((artist) => {
    const card = document.createElement('div');
    card.className = 'artist-card';
    const img = document.createElement('img');
    img.src = 'assets/artist_avatar.png';
    card.appendChild(img);
    const nameEl = document.createElement('p');
    nameEl.textContent = artist;
    card.appendChild(nameEl);
    artistsRow.appendChild(card);
  });
}

/**
 * Load a song into the audio element and update the UI with
 * its metadata. Resets the progress bar and highlights the
 * currently selected track in the library.
 *
 * @param {number} index Index of the song to load
 */
function loadSong(index) {
  // Guard against empty song lists
  if (!songs || songs.length === 0) {
    // Clear out any currently displayed information
    currentSongIndex = 0;
    audio.src = '';
    if (songTitleEl) songTitleEl.textContent = '';
    if (songArtistEl) songArtistEl.textContent = '';
    if (albumArtEl) albumArtEl.src = '';
    if (popupAlbumArt) popupAlbumArt.src = '';
    if (popupSongTitle) popupSongTitle.textContent = '';
    if (popupSongArtist) popupSongArtist.textContent = '';
    // Reset time displays
    currentTimeEl.textContent = '0:00';
    durationEl.textContent = '0:00';
    progressRange.value = 0;
    progressRange.max = 0;
    renderSongList();
    return;
  }
  currentSongIndex = index;
  const song = songs[currentSongIndex];
  // If no song found, exit gracefully
  if (!song) return;
  audio.src = song.url;
  if (songTitleEl) songTitleEl.textContent = song.title;
  if (songArtistEl) songArtistEl.textContent = song.artist;
  // Update the album art if available
  if (albumArtEl) {
    albumArtEl.src = song.coverUrl || 'assets/album_art.png';
  }
  // Update the album popup elements when available. These show a larger
  // cover image and song information on the right side of the screen.
  if (popupAlbumArt) {
    popupAlbumArt.src = song.coverUrl || 'assets/album_art.png';
  }
  if (popupSongTitle) {
    popupSongTitle.textContent = song.title;
  }
  if (popupSongArtist) {
    popupSongArtist.textContent = song.artist;
  }
  // Reset time displays until metadata is loaded
  currentTimeEl.textContent = '0:00';
  durationEl.textContent = '0:00';
  progressRange.value = 0;
  progressRange.max = 0;
  // Re-render the list to update active state
  renderSongList();
}

/**
 * Begin playback of the current song. Updates the play/pause
 * button text accordingly.
 */
function playSong() {
  // Do nothing if there are no songs
  if (!songs || songs.length === 0) return;
  audio.play();
  isPlaying = true;
  playPauseBtn.textContent = '❚❚';

  // Record this song as recently played
  const currentSong = songs[currentSongIndex];
  if (currentSong) {
    updateRecentlyPlayed(currentSong);
  }
}

/**
 * Pause playback. Updates the play/pause button text accordingly.
 */
function pauseSong() {
  audio.pause();
  isPlaying = false;
  playPauseBtn.textContent = '▶';
}

/**
 * Play the previous track in the playlist. Wraps around to
 * the last track when at the beginning of the list.
 */
function prevSong() {
  // If looping current song, simply restart it
  if (loopMode === 1) {
    loadSong(currentSongIndex);
    playSong();
    return;
  }
  if (currentQueue && Array.isArray(currentQueue) && currentQueue.length) {
    // Navigate within the queue
    if (isShuffle) {
      queuePosition = Math.floor(Math.random() * currentQueue.length);
    } else {
      queuePosition = (queuePosition - 1 + currentQueue.length) % currentQueue.length;
    }
    const idx = currentQueue[queuePosition];
    loadSong(idx);
    playSong();
  } else {
    // Default behaviour using global songs array
    let newIndex;
    if (isShuffle) {
      newIndex = Math.floor(Math.random() * songs.length);
    } else {
      newIndex = (currentSongIndex - 1 + songs.length) % songs.length;
    }
    loadSong(newIndex);
    playSong();
  }
}

/**
 * Play the next track in the playlist. Wraps around to
 * the first track when at the end of the list.
 */
function nextSong() {
  // If looping current song, simply restart it
  if (loopMode === 1) {
    loadSong(currentSongIndex);
    playSong();
    return;
  }
  if (currentQueue && Array.isArray(currentQueue) && currentQueue.length) {
    // Navigate within the queue
    if (isShuffle) {
      queuePosition = Math.floor(Math.random() * currentQueue.length);
    } else {
      queuePosition = (queuePosition + 1) % currentQueue.length;
    }
    const idx = currentQueue[queuePosition];
    loadSong(idx);
    playSong();
  } else {
    // Default behaviour using global songs array
    let newIndex;
    if (isShuffle) {
      newIndex = Math.floor(Math.random() * songs.length);
    } else {
      newIndex = (currentSongIndex + 1) % songs.length;
    }
    loadSong(newIndex);
    playSong();
  }
}

/**
 * Format a time value in seconds into a string of the form
 * minutes:seconds (e.g., 3:07). If the value is NaN or infinite,
 * returns "0:00".
 *
 * @param {number} seconds
 * @returns {string}
 */
function formatTime(seconds) {
  if (!isFinite(seconds) || isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Update the progress bar and current time display as the
 * audio plays.
 */
function updateProgress() {
  progressRange.value = audio.currentTime;
  currentTimeEl.textContent = formatTime(audio.currentTime);
}

/**
 * Set the duration display and configure the progress bar's
 * maximum value once the audio's metadata has loaded.
 */
function updateDuration() {
  progressRange.max = audio.duration || 0;
  durationEl.textContent = formatTime(audio.duration);
}

/**
 * Seek to a new position in the track when the user drags
 * the progress slider.
 */
function handleProgressChange(event) {
  const newTime = parseFloat(event.target.value);
  if (!isNaN(newTime)) {
    audio.currentTime = newTime;
  }
}

/**
 * Toggle shuffle mode on/off. When enabled, next/prev will choose
 * random songs. The shuffle button gets an active class to reflect state.
 */
function toggleShuffle() {
  isShuffle = !isShuffle;
  if (shuffleBtn) {
    shuffleBtn.classList.toggle('active', isShuffle);
  }
}

/**
 * Cycle through loop modes. Currently supports two states:
 * 0 = no loop, 1 = loop current track. When toggled, the loop button
 * updates its icon and active state.
 */
function toggleLoop() {
  loopMode = (loopMode + 1) % 2;
  if (loopBtn) {
    // Active when looping current
    loopBtn.classList.toggle('active', loopMode === 1);
    loopBtn.textContent = loopMode === 1 ? '🔂' : '🔁';
  }
}

/**
 * Toggle visibility of the album art thumbnail. Useful for hiding
 * or showing the cover image in the player bar.
 */
function toggleAlbumArt() {
  // Toggle the album art popup. When the popup is shown we hide the
  // small thumbnail in the player bar, and when hidden we show
  // the thumbnail again. This prevents duplication of album art on
  // screen.
  if (albumPopup) {
    albumPopup.classList.toggle('show');
  }
  albumArtVisible = !albumArtVisible;
  if (albumArtEl) {
    albumArtEl.style.display = albumArtVisible ? 'block' : 'none';
  }
}

/**
 * Play a specific queue of songs. Used for playlist playback. When
 * provided with an array of song indices, the player will cycle
 * through these indices instead of the entire songs list.
 *
 * @param {number[]} queueIndices Array of song indices to play
 */
function playPlaylist(queueIndices) {
  if (!Array.isArray(queueIndices) || queueIndices.length === 0) return;
  currentQueue = queueIndices.slice();
  queuePosition = 0;
  const firstIndex = currentQueue[0];
  loadSong(firstIndex);
  playSong();
}

/**
 * Initialise the application when the DOM is fully loaded.
 * Sets up event listeners and loads the first song.
 */
function init() {
  // Assign album popup elements now that the DOM is fully loaded. Do this early
  // so that loadSong() can update them correctly when it runs later.
  albumPopup = document.getElementById('album-popup');
  popupAlbumArt = document.getElementById('popup-album-art');
  popupSongTitle = document.getElementById('popup-song-title');
  popupSongArtist = document.getElementById('popup-song-artist');

  // Load persisted user lists
  loadUserLists();
  renderSongList();
  // Render trending grid, artists row, and recently played
  renderTrendingGrid();
  renderArtistsRow();
  renderRecentlyPlayed();
  loadSong(0);

  // If a liked songs container exists on this page, render the liked songs list
  if (document.getElementById('liked-container')) {
    renderLikedSongs();
  }
  // Control buttons
  playPauseBtn.addEventListener('click', () => {
    if (isPlaying) pauseSong();
    else playSong();
  });
  prevBtn.addEventListener('click', prevSong);
  nextBtn.addEventListener('click', nextSong);
  // Audio event listeners
  audio.addEventListener('timeupdate', updateProgress);
  audio.addEventListener('loadedmetadata', updateDuration);
  audio.addEventListener('ended', nextSong);
  // Progress bar seeking
  progressRange.addEventListener('input', handleProgressChange);

  // Volume control: set initial volume and listen for changes
  if (volumeRange) {
    // Set current volume to previous value if stored, otherwise default to 1
    try {
      const storedVol = localStorage.getItem('volumeLevel');
      if (storedVol !== null) {
        const vol = parseFloat(storedVol);
        if (!isNaN(vol)) {
          audio.volume = vol;
          volumeRange.value = vol;
        }
      }
    } catch (e) {
      // ignore
    }
    volumeRange.addEventListener('input', (e) => {
      const vol = parseFloat(e.target.value);
      if (!isNaN(vol)) {
        audio.volume = vol;
        try {
          localStorage.setItem('volumeLevel', vol.toString());
        } catch (err) {
          // ignore if localStorage is unavailable
        }
      }
    });
  }

  // If a file input exists on the page (index.html), bind upload handler
  if (fileInput) {
    fileInput.addEventListener('change', handleFileUpload);
    // Also hook up a visible upload button (if present) to trigger the hidden input
    // Bind any visible upload audio buttons to trigger the hidden file input
    const uploadButtons = [];
    const btn1 = document.getElementById('upload-audio-btn');
    if (btn1) uploadButtons.push(btn1);
    const btn2 = document.getElementById('upload-audio-main-btn');
    if (btn2) uploadButtons.push(btn2);
    uploadButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        fileInput.click();
      });
    });
  }

  // Bind search input for filtering songs on the home page
  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      currentSearchQuery = e.target.value;
      // Re-render trending grid with filtered results (home page only)
      renderTrendingGrid(getFilteredSongs());
      // If on the liked songs page, re-render the liked list based on the query
      if (document.getElementById('liked-container')) {
        renderLikedSongs();
      }
    });
  }


  // Bind shuffle, loop and album art toggle buttons
  if (shuffleBtn) shuffleBtn.addEventListener('click', toggleShuffle);
  if (loopBtn) loopBtn.addEventListener('click', toggleLoop);
  if (toggleAlbumBtn) toggleAlbumBtn.addEventListener('click', toggleAlbumArt);
}

// Wait for DOM content before running init
document.addEventListener('DOMContentLoaded', init);

// Expose playPlaylist function globally for playlist pages
window.playPlaylist = playPlaylist;