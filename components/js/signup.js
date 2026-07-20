let signupSubmitPending = false;


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
 * Wires the signup form validation and the privacy consent handling.
 */
function initSignupValidation() {
  const form = document.getElementById("signupForm");
  if (!form) return;
  form.addEventListener("submit", handleSignup);
  form.addEventListener("input", syncPrivacyConsent);
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
  window.open(event.currentTarget.href, "_blank", "noopener,noreferrer");
}


/**
 * Enables consent only after every other signup field is valid.
 */
function syncPrivacyConsent() {
  const fieldsValid = areSignupFieldsValid();
  getPrivacyCheckbox().disabled = !fieldsValid;
  if (!fieldsValid) getPrivacyCheckbox().checked = false;
  updatePrivacyConsentHint(fieldsValid);
  updateSignupButton();
}


/**
 * Explains whether the required signup fields allow consent.
 * @param {boolean} fieldsValid - True when every other field is valid.
 */
function updatePrivacyConsentHint(fieldsValid) {
  getPrivacyConsentHint().textContent = fieldsValid
    ? "All required fields are valid. You can now accept the Privacy Policy."
    : "Complete all required fields to enable this checkbox.";
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
  return areSignupFieldsValid() && getPrivacyCheckbox().checked;
}


/**
 * @returns {boolean} True when every signup field except consent is valid.
 */
function areSignupFieldsValid() {
  return Boolean(
    getSignupName() &&
    isEmailValid() &&
    getSignupPassword() &&
    passwordsMatch(),
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
  if (!getPrivacyCheckbox().checked) return "Please accept the Privacy Policy.";
  return "";
}


/**
 * @returns {boolean} True when the entered email matches the email pattern.
 */
function isEmailValid() {
  return isEmailAddressValid(getSignupEmail());
}


/**
 * @returns {boolean} True when both entered passwords are identical.
 */
function passwordsMatch() {
  return getSignupPassword() === getSignupConfirmPassword();
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
