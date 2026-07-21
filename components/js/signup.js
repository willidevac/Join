let signupSubmitPending = false;
const signupFieldIds = [
  "signupName",
  "signupEmail",
  "signupPassword",
  "signupConfirmPassword",
];
const touchedSignupFields = new Set();


/**
 * Validates the signup form and registers the user on success.
 * @param {Event} event - The form submit event.
 */
async function handleSignup(event) {
  event.preventDefault();
  if (signupSubmitPending) return;
  touchAllSignupFields();
  renderTouchedSignupErrors();
  syncPrivacyConsent();
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
    navigateToPage("login", { signup: "success" });
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
  await auth.registerFirebaseUser(
    getSignupName(),
    getSignupEmail(),
    getSignupPassword(),
  );
  await auth.logoutFirebaseUser();
  clearStoredUser();
}


/**
 * Wires the signup form validation and the privacy consent handling.
 */
function initSignupValidation() {
  const form = document.getElementById("signupForm");
  if (!form) return;
  touchedSignupFields.clear();
  form.addEventListener("submit", handleSignup);
  form.addEventListener("input", handleSignupInput);
  form.addEventListener("blur", handleSignupFieldBlur, true);
  getPrivacyLinks().forEach((link) => {
    link.addEventListener("click", handlePrivacyPolicyOpen);
  });
  getPrivacyCheckbox().addEventListener("change", updateSignupButton);
  syncPrivacyConsent();
}


/** Refreshes visible validation while the user corrects a touched field. */
function handleSignupInput() {
  renderTouchedSignupErrors();
  syncPrivacyConsent();
}


/**
 * Validates one signup field as soon as it loses focus.
 * @param {FocusEvent} event - Blur event from the signup form.
 */
function handleSignupFieldBlur(event) {
  const fieldId = event.target && event.target.id;
  if (!signupFieldIds.includes(fieldId)) return;
  touchedSignupFields.add(fieldId);
  renderSignupFieldError(fieldId);
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
  updateSignupButton();
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
    isSignupNameValid() &&
    isEmailValid() &&
    isSignupPasswordValid() &&
    passwordsMatch(),
  );
}


/**
 * Returns the message for the first failed signup rule.
 * @returns {string} The error text, or an empty string when valid.
 */
function getSignupErrorMessage() {
  if (!areSignupFieldsValid()) return "Please correct the highlighted fields.";
  if (!getPrivacyCheckbox().checked) return "Please accept the Privacy Policy.";
  return "";
}


/** Marks every signup input as touched before submit validation. */
function touchAllSignupFields() {
  signupFieldIds.forEach((fieldId) => touchedSignupFields.add(fieldId));
}


/** Renders validation feedback for every field the user already left. */
function renderTouchedSignupErrors() {
  touchedSignupFields.forEach(renderSignupFieldError);
}


/**
 * Updates the message and accessibility state of one signup input.
 * @param {string} fieldId - Id of the input to validate.
 */
function renderSignupFieldError(fieldId) {
  const error = getSignupFieldError(fieldId);
  document.getElementById(`${fieldId}Error`).textContent = error;
  document.getElementById(fieldId).setAttribute("aria-invalid", String(Boolean(error)));
}


/** @returns {string} Validation feedback for one signup input. */
function getSignupFieldError(fieldId) {
  const errors = {
    signupName: getSignupNameError(),
    signupEmail: isEmailValid() ? "" : "Enter a valid email address.",
    signupPassword: getSignupPasswordError(),
    signupConfirmPassword: getSignupConfirmPasswordError(),
  };
  return errors[fieldId] || "";
}


/** @returns {string} Name validation feedback. */
function getSignupNameError() {
  if (!getSignupName()) return "Please enter your name.";
  return isSignupNameValid() ? "" : "Enter at least 2 characters.";
}


/** @returns {string} Password validation feedback. */
function getSignupPasswordError() {
  if (!getSignupPassword()) return "Please enter a password.";
  return isSignupPasswordValid() ? "" : "Use at least 6 characters.";
}


/** @returns {string} Password confirmation feedback. */
function getSignupConfirmPasswordError() {
  if (!getSignupConfirmPassword()) return "Please confirm your password.";
  return passwordsMatch() ? "" : "Passwords do not match.";
}


/** @returns {boolean} True when the trimmed name has at least two characters. */
function isSignupNameValid() {
  return getSignupName().length >= 2;
}


/**
 * @returns {boolean} True when the entered email matches the email pattern.
 */
function isEmailValid() {
  return isEmailAddressValid(getSignupEmail());
}


/** @returns {boolean} True when Firebase's minimum password length is met. */
function isSignupPasswordValid() {
  return getSignupPassword().length >= 6;
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
 * @returns {string} The trimmed password from the signup form.
 */
function getSignupPassword() {
  return document.getElementById("signupPassword").value.trim();
}


/**
 * @returns {string} The trimmed password confirmation from the signup form.
 */
function getSignupConfirmPassword() {
  return document.getElementById("signupConfirmPassword").value.trim();
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
