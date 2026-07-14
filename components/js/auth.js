const AUTH_ERROR_MESSAGES = {
  "auth/firebase-unavailable":
    "Authentication could not be loaded. Please try again later.",
  "auth/invalid-credential": "Please check your email and password.",
  "auth/email-already-in-use": "This email address is already registered.",
  "auth/weak-password": "Please use at least 6 characters.",
  "auth/operation-not-allowed": "This login method is not enabled yet.",
  "auth/network-request-failed": "Please check your internet connection.",
};
const AUTH_EMAIL_PATTERN = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
let signupDraft = null;


/**
 * Signs in through Firebase and opens the protected summary page.
 */
async function handleLogin(email, password) {
  await loginWithFirebase(email, password);
}

async function handleSignup(event) {
  event.preventDefault();
  if (!isSignupFormValid()) {
    showSignupMessage(getSignupErrorMessage());
    return;
  }
  await registerUser();
}

/**
 * Wraps signup saving so Firebase errors can be shown in the form.
 */
async function registerUser() {
  try {
    await saveSignedUpUser();
    clearSignupState();
    navigateToPage("summary");
  } catch (error) {
    showSignupMessage(getAuthErrorMessage(error));
  }
}

/**
 * Saves a new signup only through Firebase Authentication.
 */
async function saveSignedUpUser() {
  const auth = getFirebaseAuthAdapter();
  const user = await auth.registerFirebaseUser(
    getSignupName(),
    getSignupEmail(),
    getSignupPassword(),
  );
  saveStoredUser(user);
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
  try {
    await loginGuestUser();
  } catch (error) {
    showLoginError(getAuthErrorMessage(error));
  }
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
  if (isFirebaseAuthReady()) await window.joinFirebaseAuth.logoutFirebaseUser();
  clearStoredUser();
  navigateToPage("login");
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
  return AUTH_ERROR_MESSAGES[code] || "Authentication is currently not available.";
}

function initSignupValidation() {
  const form = document.getElementById("signupForm");
  if (!form) return;
  rememberPrivacyReturn();
  restoreSignupDraft();
  form.addEventListener("input", updateSignupButton);
  getPrivacyLinks().forEach((link) => {
    link.addEventListener("click", handlePrivacyPolicyOpen);
  });
  getPrivacyCheckbox().addEventListener("change", updateSignupButton);
  syncPrivacyConsent();
}

/**
 * Keeps the current form values in memory before opening the Privacy Policy.
 */
function handlePrivacyPolicyOpen() {
  signupDraft = getSignupDraft();
  rememberPrivacyOpened();
}

/**
 * Returns the signup values without writing credentials to browser storage.
 */
function getSignupDraft() {
  return {
    name: getSignupName(),
    email: getSignupEmail(),
    password: getSignupPassword(),
    confirmPassword: getSignupConfirmPassword(),
  };
}

/**
 * Restores form values after returning from the Privacy Policy.
 */
function restoreSignupDraft() {
  if (!signupDraft) return;
  setSignupValue("signupName", signupDraft.name);
  setSignupValue("signupEmail", signupDraft.email);
  setSignupValue("signupPassword", signupDraft.password);
  setSignupValue("signupConfirmPassword", signupDraft.confirmPassword);
}

function setSignupValue(elementId, value) {
  document.getElementById(elementId).value = value;
}

function clearSignupState() {
  signupDraft = null;
  sessionStorage.removeItem("joinPrivacyOpened");
}

function rememberPrivacyOpened() {
  sessionStorage.setItem("joinPrivacyOpened", "true");
}

function rememberPrivacyReturn() {
  const params = new URLSearchParams(window.location.search);

  if (params.get("privacy") !== "opened") {
    return;
  }

  rememberPrivacyOpened();
  params.delete("privacy");
  window.history.replaceState({}, "", `?${params.toString()}`);
}

function syncPrivacyConsent() {
  const hasOpenedPrivacy = hasOpenedPrivacyPolicy();
  getPrivacyCheckbox().disabled = !hasOpenedPrivacy;
  updatePrivacyConsentHint(hasOpenedPrivacy);
  updateSignupButton();
}

function updatePrivacyConsentHint(hasOpenedPrivacy) {
  getPrivacyConsentHint().textContent = hasOpenedPrivacy
    ? "Privacy Policy opened. You can now accept it."
    : "Open the Privacy Policy first to enable this checkbox.";
}

function updateSignupButton() {
  getSignupButton().disabled = !isSignupFormValid();
  if (isSignupFormValid()) showSignupMessage("");
}

function isSignupFormValid() {
  return Boolean(
    getSignupName() &&
    isEmailValid() &&
    getSignupPassword() &&
    passwordsMatch() &&
    hasOpenedPrivacyPolicy() &&
    getPrivacyCheckbox().checked,
  );
}

function getSignupErrorMessage() {
  if (!getSignupName()) return "Please enter your name.";
  if (!isEmailValid()) return "Please enter a valid email address.";
  if (!getSignupPassword()) return "Please enter a password.";
  if (!passwordsMatch()) return "Your passwords do not match.";
  if (!hasOpenedPrivacyPolicy()) return "Please open the Privacy Policy first.";
  if (!getPrivacyCheckbox().checked) return "Please accept the Privacy Policy.";
  return "";
}

function isEmailValid() {
  return AUTH_EMAIL_PATTERN.test(getSignupEmail());
}

function passwordsMatch() {
  return getSignupPassword() === getSignupConfirmPassword();
}

function hasOpenedPrivacyPolicy() {
  return sessionStorage.getItem("joinPrivacyOpened") === "true";
}

function getSignupName() {
  return document.getElementById("signupName").value.trim();
}

function getSignupEmail() {
  return document.getElementById("signupEmail").value.trim();
}

function getSignupPassword() {
  return document.getElementById("signupPassword").value;
}

function getSignupConfirmPassword() {
  return document.getElementById("signupConfirmPassword").value;
}

function getPrivacyCheckbox() {
  return document.getElementById("privacyAccepted");
}

function getPrivacyLinks() {
  return document.querySelectorAll('[data-page="privacy-policy"]');
}

function getPrivacyConsentHint() {
  return document.getElementById("privacyConsentHint");
}

function getSignupButton() {
  return document.getElementById("signupButton");
}

function showSignupMessage(message) {
  document.getElementById("signupMessage").textContent = message;
}
