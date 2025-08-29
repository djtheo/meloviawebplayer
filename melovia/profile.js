/*
 * Profile page script.
 *
 * Handles loading and saving a custom profile picture. The picture is
 * stored in localStorage as a Base64 data URL so it persists across
 * sessions. A default avatar is used when no picture has been set.
 */

document.addEventListener('DOMContentLoaded', () => {
  const imgEl = document.getElementById('profile-pic');
  const inputEl = document.getElementById('profile-pic-input');

  /**
   * Load a previously saved profile picture from localStorage, if any,
   * and apply it to the image element.
   */
  function loadProfilePic() {
    try {
      const saved = localStorage.getItem('profilePic');
      if (saved) {
        imgEl.src = saved;
      }
    } catch (e) {
      console.warn('Could not load profile picture', e);
    }
  }

  /**
   * Handle file selection. Reads the chosen file as a Data URL and
   * updates the profile picture. Also saves it to localStorage.
   * @param {Event} e
   */
  function handleFileChange(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target.result;
      imgEl.src = dataUrl;
      try {
        localStorage.setItem('profilePic', dataUrl);
      } catch (err) {
        console.warn('Could not save profile picture', err);
      }
    };
    reader.readAsDataURL(file);
  }

  // Bind change event to the hidden file input
  if (inputEl) {
    inputEl.addEventListener('change', handleFileChange);
  }

  // Load saved picture on page load
  loadProfilePic();

  // Populate the profile name and email from localStorage if the user is logged in
  try {
    const email = localStorage.getItem('userEmail');
    if (email) {
      const nameEl = document.getElementById('profile-name');
      const emailEl = document.getElementById('profile-email');
      if (nameEl) {
        // Use the part before the '@' as a simple display name
        const username = email.split('@')[0];
        nameEl.textContent = username || email;
      }
      if (emailEl) {
        emailEl.textContent = email;
      }
    }
  } catch (e) {
    console.warn('Could not load user email for profile', e);
  }
});