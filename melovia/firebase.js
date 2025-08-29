/*
 * Firebase configuration and initialization file.
 *
 * Replace the placeholder values below with your actual Firebase
 * project configuration. You can obtain these settings from your
 * Firebase console under Project Settings > General > Your apps.
 */

// Firebase configuration generated for the Melovia project.
// Replace the values below only if you create a new Firebase project.
const firebaseConfig = {
  apiKey: 'AIzaSyAP0_DWol9_2YDD3yg3b1c95oqt3LSSr0A',
  authDomain: 'melovia-1867d.firebaseapp.com',
  projectId: 'melovia-1867d',
  // The storage bucket should use the default appspot.com domain
  storageBucket: 'melovia-1867d.appspot.com',
  messagingSenderId: '963951353372',
  appId: '1:963951353372:web:8633c269fbd5d2f9ff89d9',
  measurementId: 'G-DR0YNN9TQY',
};

/*
 * The following imports and initialization use the modular Firebase SDK
 * introduced in Firebase v9+. If you are bundling your JavaScript with
 * a module bundler (e.g. webpack, Vite), you can uncomment this code
 * and remove the compat initialization below. For usage in the current
 * project, the compat libraries are loaded via script tags in the HTML,
 * so the global `firebase` object is used instead.
 *
 * import { initializeApp } from 'firebase/app';
 * import { getAnalytics } from 'firebase/analytics';
 * const app = initializeApp(firebaseConfig);
 * const analytics = getAnalytics(app);
 */

// Initialize Firebase using the compat API available on the global `firebase` object.
let firebaseApp;
try {
  firebaseApp = firebase.initializeApp(firebaseConfig);
  // Optionally enable analytics if the analytics SDK is loaded
  if (firebase.analytics) {
    firebase.analytics();
  }
} catch (err) {
  console.warn('Firebase initialization failed. Please provide valid configuration.', err);
}