/*
 * Simple authentication gating.
 *
 * Pages other than the login page should include this script. It checks
 * whether a user has logged in by looking for the 'isLoggedIn' flag in
 * localStorage. If the flag is not present or falsey, the script
 * redirects the visitor to the login page. This ensures that the
 * application starts at the login page by default and that the rest of
 * the site remains hidden until login is complete.
 */

function checkAuth() {
  try {
    const loggedIn = localStorage.getItem('isLoggedIn');
    if (!loggedIn || loggedIn !== 'true') {
      // Only redirect if we're not already on the login page
      if (!window.location.pathname.endsWith('login.html')) {
        window.location.replace('login.html');
      }
    }
  } catch (e) {
    console.warn('Authentication check failed', e);
  }
}

// Attach our auth check to DOMContentLoaded so it runs once the document is ready
document.addEventListener('DOMContentLoaded', () => {
  checkAuth();
  // Attach logout handler if a logout link exists on the page.  The logout
  // action simply clears our local login flag and redirects to the login
  // page.  We don't explicitly call Firebase's signOut here since the
  // Firebase libraries are only loaded on the login page; clearing the
  // flag is sufficient for our basic gating.
  const logoutLink = document.getElementById('logout-link');
  if (logoutLink) {
    logoutLink.addEventListener('click', (ev) => {
      ev.preventDefault();
      try {
        localStorage.removeItem('isLoggedIn');
      } catch (e) {
        console.warn('Could not clear login flag', e);
      }
      // Redirect the user to the login page after logging out
      window.location.href = 'login.html';
    });
  }
});