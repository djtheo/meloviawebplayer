/*
 * Theme customization script.
 *
 * This script allows users to change the accent colour of the
 * application via a colour picker. The selected colour is stored
 * in localStorage so that it persists across page reloads and
 * navigation to different pages. When a colour is chosen,
 * the script also computes a slightly lighter variant for hover
 * states and updates CSS custom properties accordingly.
 */

/**
 * Lighten a hex colour by a given percentage.
 *
 * @param {string} color Hex colour string starting with '#'
 * @param {number} percent Value between 0 and 100 indicating the amount
 *   of lightness to add.
 * @returns {string} Lightened hex colour
 */
function lightenColor(color, percent) {
  const num = parseInt(color.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) + amt;
  const G = ((num >> 8) & 0x00ff) + amt;
  const B = (num & 0x0000ff) + amt;
  const newColor =
    0x1000000 +
    (R < 255 ? (R < 0 ? 0 : R) : 255) * 0x10000 +
    (G < 255 ? (G < 0 ? 0 : G) : 255) * 0x100 +
    (B < 255 ? (B < 0 ? 0 : B) : 255);
  return '#' + newColor.toString(16).slice(1);
}

/**
 * Apply the chosen accent colour to the document by updating CSS
 * variables. Also save the choice to localStorage for persistence.
 *
 * @param {string} color The new accent colour in hex notation
 */
function applyAccent(color) {
  const hover = lightenColor(color, 10);
  const root = document.documentElement;
  root.style.setProperty('--accent', color);
  root.style.setProperty('--accent-hover', hover);
  // Persist the accent colour
  localStorage.setItem('accentColor', color);
}

/**
 * Initialise theme customisation. On pages with a colour picker
 * element (with the ID `accent-color-picker`), attach a change
 * listener to update the accent colour when the user selects a
 * new value. On all pages, ensure any previously stored accent
 * colour is applied on load.
 */
function initTheme() {
  const picker = document.getElementById('accent-color-picker');
  const saved = localStorage.getItem('accentColor');
  if (saved) {
    applyAccent(saved);
    if (picker) picker.value = saved;
  }
  if (picker) {
    picker.addEventListener('input', (e) => {
      applyAccent(e.target.value);
    });
  }
}

document.addEventListener('DOMContentLoaded', initTheme);