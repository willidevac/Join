const authErrorMessages = {
  "auth/firebase-unavailable":
    "Authentication could not be loaded. Please try again later.",
  "auth/invalid-email": "Invalid password or email.",
  "auth/user-not-found": "Invalid password or email.",
  "auth/invalid-credential": "Invalid password or email.",
  "auth/invalid-password": "Invalid password or email.",
  "auth/wrong-password": "Invalid password or email.",
  "auth/email-already-in-use": "This email address is already registered.",
  "auth/weak-password": "Please use at least 6 characters.",
  "auth/operation-not-allowed": "This login method is not enabled yet.",
  "auth/network-request-failed": "Please check your internet connection.",
};
/**
 * Signs in through Firebase and opens the protected summary page.
 */
async function handleLogin(email, password) {
  await loginWithFirebase(email, password);
}


/**
 * Stores the Firebase login result and opens the protected summary page.
 */
async function loginWithFirebase(email, password) {
  const auth = getFirebaseAuthAdapter();
  const user = await auth.loginFirebaseUser(email, password);
  saveStoredUser(user);
  navigateToPage("summary");
}


/**
 * Starts the guest login and shows a login message if Firebase rejects it.
 */
async function handleGuestLogin() {
  setGuestLoginPending(true);
  try {
    await loginGuestUser();
  } catch (error) {
    showLoginError(getAuthErrorMessage(error));
  } finally {
    setGuestLoginPending(false);
  }
}


/**
 * Locks the guest button while Firebase processes the sign-in request.
 * @param {boolean} isPending - True while the guest login is pending.
 */
function setGuestLoginPending(isPending) {
  const button = document.getElementById("guestLoginButton");
  if (!button) return;
  button.disabled = isPending;
  button.setAttribute("aria-busy", String(isPending));
}


/**
 * Uses Firebase Anonymous Authentication for the guest login.
 */
async function loginGuestUser() {
  const auth = getFirebaseAuthAdapter();
  const user = await auth.loginGuestFirebaseUser();
  saveStoredUser(user);
  navigateToPage("summary");
}


/**
 * Signs out from Firebase, clears the local user and returns to login.
 */
async function handleLogout() {
  try {
    if (isFirebaseAuthReady()) await window.joinFirebaseAuth.logoutFirebaseUser();
  } catch {
    // A remote sign-out failure must not block clearing the local session.
  } finally {
    clearStoredUser();
    navigateToPage("login");
  }
}


/**
 * Checks whether the Firebase adapter finished loading on window.
 */
function isFirebaseAuthReady() {
  return Boolean(window.joinFirebaseAuth);
}


/**
 * Returns the Firebase adapter or stops authentication with a clear error.
 */
function getFirebaseAuthAdapter() {
  if (isFirebaseAuthReady()) return window.joinFirebaseAuth;
  throw createFirebaseUnavailableError();
}


/**
 * Creates the shared error for an unavailable Firebase Authentication service.
 */
function createFirebaseUnavailableError() {
  const error = new Error("Firebase Authentication is unavailable.");
  error.code = "auth/firebase-unavailable";
  return error;
}


/**
 * Converts Firebase error codes into short messages for the auth forms.
 */
function getAuthErrorMessage(error) {
  const code = error && error.code;
  return authErrorMessages[code] || "Authentication is currently not available.";
}
