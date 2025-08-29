/*
 * Handles user authentication via Firebase Authentication.
 *
 * This script attaches a submit handler to the login form to sign users in
 * with email and password. It displays feedback messages on success or
 * failure. It assumes that firebase.js has been loaded and configured.
 */

document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('login-form');
  const emailInput = document.getElementById('login-email');
  const passwordInput = document.getElementById('login-password');
  const messageEl = document.getElementById('login-message');

  // Elements for registration
  const registerForm = document.getElementById('register-form');
  const registerEmail = document.getElementById('register-email');
  const registerPassword = document.getElementById('register-password');
  const registerConfirm = document.getElementById('register-confirm');
  const registerMessageEl = document.getElementById('register-message');
  const authHeading = document.getElementById('auth-heading');
  // Toggle links
  const showRegisterLink = document.getElementById('show-register');
  const showLoginLink = document.getElementById('show-login');

  if (!loginForm) return;

  loginForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    messageEl.textContent = '';
    if (!firebaseApp) {
      messageEl.textContent = 'Firebase is not configured. Please provide your Firebase API key in firebase.js.';
      return;
    }
    if (!email || !password) {
      messageEl.textContent = 'Please enter your email and password.';
      return;
    }
    const auth = firebase.auth();
    auth
      .signInWithEmailAndPassword(email, password)
      .then((userCredential) => {
        // Signed in
        messageEl.style.color = '#27ae60';
        messageEl.textContent = 'Sign in successful! Redirecting...';
        // Mark the user as logged in so other pages can load and store email
        try {
          localStorage.setItem('isLoggedIn', 'true');
          // Save the user's email for display on the profile page
          localStorage.setItem('userEmail', email);
        } catch (e) {
          console.warn('Could not set login flag', e);
        }
        // Redirect to the home page after a short delay
        setTimeout(() => {
          window.location.href = 'index.html';
        }, 800);
      })
      .catch((error) => {
        messageEl.style.color = '#e74c3c';
        messageEl.textContent = error.message;
      });
  });

  // Register form submission
  if (registerForm) {
    registerForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const email = registerEmail.value.trim();
      const password = registerPassword.value;
      const confirm = registerConfirm.value;
      registerMessageEl.style.color = '#e74c3c';
      registerMessageEl.textContent = '';
      if (!firebaseApp) {
        registerMessageEl.textContent = 'Firebase is not configured. Please provide your Firebase API key in firebase.js.';
        return;
      }
      if (!email || !password || !confirm) {
        registerMessageEl.textContent = 'Please complete all fields.';
        return;
      }
      if (password !== confirm) {
        registerMessageEl.textContent = 'Passwords do not match.';
        return;
      }
      const auth = firebase.auth();
      auth
        .createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
          registerMessageEl.style.color = '#27ae60';
          registerMessageEl.textContent = 'Account created successfully! Redirecting...';
          try {
            localStorage.setItem('isLoggedIn', 'true');
            // Save the user's email for display on the profile page
            localStorage.setItem('userEmail', email);
          } catch (e) {
            console.warn('Could not set login flag', e);
          }
          setTimeout(() => {
            window.location.href = 'index.html';
          }, 800);
        })
        .catch((error) => {
          registerMessageEl.style.color = '#e74c3c';
          registerMessageEl.textContent = error.message;
        });
    });
  }

  // Toggle between login and register forms
  function showRegister() {
    if (loginForm) loginForm.style.display = 'none';
    if (registerForm) registerForm.style.display = 'flex';
    authHeading.textContent = 'Create Account';
  }
  function showLogin() {
    if (registerForm) registerForm.style.display = 'none';
    if (loginForm) loginForm.style.display = 'flex';
    authHeading.textContent = 'Sign In';
    // Clear any previous messages
    messageEl.textContent = '';
    registerMessageEl.textContent = '';
  }
  if (showRegisterLink) {
    showRegisterLink.addEventListener('click', (e) => {
      e.preventDefault();
      showRegister();
    });
  }
  if (showLoginLink) {
    showLoginLink.addEventListener('click', (e) => {
      e.preventDefault();
      showLogin();
    });
  }
});