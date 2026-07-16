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
let signupSubmitPending = false;


/**
 * Signs in through Firebase and opens the protected summary page.
 */
async function handleLogin(email, password) {
  await loginWithFirebase(email, password);
}


/**
 * Validates the signup form and registers the user on success.
 * @param {Event} event - The form submit event.
 */
async function handleSignup(event) {
  event.preventDefault();
  if (signupSubmitPending) return;
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
  setSignupSubmitPending(true);
  try {
    await saveSignedUpUser();
    clearSignupState();
    navigateToPage("summary");
  } catch (error) {
    showSignupMessage(getAuthErrorMessage(error));
  } finally {
    setSignupSubmitPending(false);
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


/**
 * Wires the signup form validation and the privacy consent handling.
 */
function initSignupValidation() {
  const form = document.getElementById("signupForm");
  if (!form) return;
  form.addEventListener("submit", handleSignup);
  form.addEventListener("input", updateSignupButton);
  getPrivacyLinks().forEach((link) => {
    link.addEventListener("click", handlePrivacyPolicyOpen);
  });
  getPrivacyCheckbox().addEventListener("change", updateSignupButton);
  syncPrivacyConsent();
}


/**
 * Opens the Privacy Policy separately so entered signup values stay in place.
 * @param {MouseEvent} event - Click on a Privacy Policy link.
 */
function handlePrivacyPolicyOpen(event) {
  event.preventDefault();
  rememberPrivacyOpened();
  syncPrivacyConsent();
  window.open(event.currentTarget.href, "_blank", "noopener,noreferrer");
}


/**
 * Clears the signup draft and the privacy-opened flag after a signup.
 */
function clearSignupState() {
  sessionStorage.removeItem("joinPrivacyOpened");
}


/**
 * Marks in sessionStorage that the Privacy Policy has been opened.
 */
function rememberPrivacyOpened() {
  sessionStorage.setItem("joinPrivacyOpened", "true");
}


/**
 * Enables the consent checkbox only after the Privacy Policy was opened.
 */
function syncPrivacyConsent() {
  const hasOpenedPrivacy = hasOpenedPrivacyPolicy();
  getPrivacyCheckbox().disabled = !hasOpenedPrivacy;
  updatePrivacyConsentHint(hasOpenedPrivacy);
  updateSignupButton();
}


/**
 * Explains below the checkbox why it is enabled or still locked.
 * @param {boolean} hasOpenedPrivacy - True when the Privacy Policy was opened.
 */
function updatePrivacyConsentHint(hasOpenedPrivacy) {
  getPrivacyConsentHint().textContent = hasOpenedPrivacy
    ? "Privacy Policy opened. You can now accept it."
    : "Open the Privacy Policy first to enable this checkbox.";
}


/**
 * Enables the signup button only while the whole form is valid.
 */
function updateSignupButton() {
  getSignupButton().disabled = signupSubmitPending || !isSignupFormValid();
  if (isSignupFormValid()) showSignupMessage("");
}


/**
 * Locks or unlocks signup while Firebase processes the registration.
 * @param {boolean} isPending - True while registration is running.
 */
function setSignupSubmitPending(isPending) {
  signupSubmitPending = isPending;
  getSignupButton().setAttribute("aria-busy", String(isPending));
  updateSignupButton();
}


/**
 * @returns {boolean} True when all signup fields and the consent are valid.
 */
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


/**
 * Returns the message for the first failed signup rule.
 * @returns {string} The error text, or an empty string when valid.
 */
function getSignupErrorMessage() {
  if (!getSignupName()) return "Please enter your name.";
  if (!isEmailValid()) return "Please enter a valid email address.";
  if (!getSignupPassword()) return "Please enter a password.";
  if (!passwordsMatch()) return "Your passwords do not match.";
  if (!hasOpenedPrivacyPolicy()) return "Please open the Privacy Policy first.";
  if (!getPrivacyCheckbox().checked) return "Please accept the Privacy Policy.";
  return "";
}


/**
 * @returns {boolean} True when the entered email matches the email pattern.
 */
function isEmailValid() {
  return AUTH_EMAIL_PATTERN.test(getSignupEmail());
}


/**
 * @returns {boolean} True when both entered passwords are identical.
 */
function passwordsMatch() {
  return getSignupPassword() === getSignupConfirmPassword();
}


/**
 * @returns {boolean} True when the Privacy Policy was opened in this session.
 */
function hasOpenedPrivacyPolicy() {
  return sessionStorage.getItem("joinPrivacyOpened") === "true";
}


/**
 * @returns {string} The trimmed name from the signup form.
 */
function getSignupName() {
  return document.getElementById("signupName").value.trim();
}


/**
 * @returns {string} The trimmed email from the signup form.
 */
function getSignupEmail() {
  return document.getElementById("signupEmail").value.trim();
}


/**
 * @returns {string} The password from the signup form.
 */
function getSignupPassword() {
  return document.getElementById("signupPassword").value;
}


/**
 * @returns {string} The password confirmation from the signup form.
 */
function getSignupConfirmPassword() {
  return document.getElementById("signupConfirmPassword").value;
}


/**
 * @returns {HTMLElement} The privacy consent checkbox.
 */
function getPrivacyCheckbox() {
  return document.getElementById("privacyAccepted");
}


/**
 * @returns {NodeList} All links that open the Privacy Policy page.
 */
function getPrivacyLinks() {
  return document.querySelectorAll('[data-page="privacy-policy"]');
}


/**
 * @returns {HTMLElement} The hint element below the consent checkbox.
 */
function getPrivacyConsentHint() {
  return document.getElementById("privacyConsentHint");
}


/**
 * @returns {HTMLElement} The submit button of the signup form.
 */
function getSignupButton() {
  return document.getElementById("signupButton");
}


/**
 * Shows a feedback message below the signup form.
 * @param {string} message - The text to display, or an empty string to clear.
 */
function showSignupMessage(message) {
  document.getElementById("signupMessage").textContent = message;
}
