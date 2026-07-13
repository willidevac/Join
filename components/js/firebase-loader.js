window.joinFirebaseReady = loadFirebaseConfig();

/**
 * Loads the local Firebase config and then starts the Firebase adapter.
 */
async function loadFirebaseConfig() {
  try {
    const response = await fetch("./components/js/firebase-config.js");
    if (!response.ok) return handleFirebaseLoadFailure();
    await loadScript("./components/js/firebase-config.js");
    await import("./firebase-auth.mjs");
    await import("./firebase-contacts.mjs");
    await import("./firebase-tasks.mjs");
    return window.joinFirebaseAuth.waitForAuthReady();
  } catch {
    return handleFirebaseLoadFailure();
  }
}


/**
 * Removes stale local auth data when Firebase cannot be loaded.
 */
function handleFirebaseLoadFailure() {
  clearStoredUser();
  return null;
}

/**
 * Adds a script tag dynamically so the ignored firebase-config.js can load.
 */
function loadScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}
