const loginFieldIds = ["loginEmail", "loginPassword"];
const touchedLoginFields = new Set();


/**
 * Wires up the login form and the guest login button.
 * Runs every time the login page fragment is rendered.
 */
function initLoginValidation() {
  const loginForm = getElement("loginForm");
  const guestLoginButton = getElement("guestLoginButton");

  if (!loginForm || !guestLoginButton) {
    return;
  }

  touchedLoginFields.clear();
  loginForm.addEventListener("submit", handleLoginSubmit);
  loginForm.addEventListener("input", handleLoginInput);
  loginForm.addEventListener("blur", handleLoginFieldBlur, true);
  guestLoginButton.addEventListener("click", handleGuestLogin);
  showSignupSuccessMessage();
}


/** Shows the one-time success feedback after a completed signup. */
function showSignupSuccessMessage() {
  const feedback = getElement("signupSuccessMessage");
  if (!feedback || !hasSignupSuccessParameter()) return;
  removeSignupSuccessParameter();
  showSignupSuccessAfterTransition(feedback);
}


/** Waits until the login transition no longer covers the feedback. */
function showSignupSuccessAfterTransition(feedback) {
  if (!isSignupTransitionRunning()) return revealSignupSuccessMessage(feedback);
  const delay = signupTransition.exitDelay + 180;
  setTimeout(() => revealSignupSuccessMessage(feedback), delay);
}


/** @returns {boolean} True while the login intro transition is visible. */
function isSignupTransitionRunning() {
  return typeof pageTransitionRunning !== "undefined" && pageTransitionRunning;
}


/** Displays the signup feedback and schedules its removal. */
function revealSignupSuccessMessage(feedback) {
  showTimedFeedback(feedback);
}


/** @returns {boolean} True when the login page was opened after signup. */
function hasSignupSuccessParameter() {
  return new URLSearchParams(window.location.search).get("signup") === "success";
}


/** Removes the consumed success marker without reloading the login page. */
function removeSignupSuccessParameter() {
  const url = new URL(window.location.href);
  url.searchParams.delete("signup");
  window.history.replaceState({}, "", url.pathname + url.search + url.hash);
}


/**
 * Handles the login form submit: validates the input and starts the login.
 * @param {SubmitEvent} event - The form submit event.
 */
async function handleLoginSubmit(event) {
  event.preventDefault();
  touchFields(loginFieldIds, touchedLoginFields);
  renderTouchedFieldErrors(touchedLoginFields, getLoginFieldError);
  const email = getTrimmedInputValue("loginEmail");
  const password = getTrimmedInputValue("loginPassword");

  if (!isLoginFormValid(email, password)) return;
  await submitLogin(email, password);
}


/**
 * Runs the login request and shows an error message if it fails.
 * Disables the submit button while the request is running.
 * @param {string} email - The email address entered by the user.
 * @param {string} password - The password entered by the user.
 */
async function submitLogin(email, password) {
  const submitButton = getElement("loginSubmitButton");
  submitButton.disabled = true;
  try {
    showLoginError("");
    await handleLogin(email, password);
  } catch (error) {
    showLoginError(getAuthErrorMessage(error));
  } finally {
    submitButton.disabled = false;
  }
}


/**
 * Checks whether email and password are filled in and the email is valid.
 * Shows a matching error message if not.
 * @param {string} email - The email address entered by the user.
 * @param {string} password - The password entered by the user.
 * @returns {boolean} True if the form input is valid.
 */
function isLoginFormValid(email, password) {
  const isValid = !getLoginEmailError(email) && !getLoginPasswordError(password);
  showLoginError("");
  return isValid;
}


/** Validates a login field as soon as it loses focus. */
function handleLoginFieldBlur(event) {
  if (!loginFieldIds.includes(event.target.id)) return;
  touchedLoginFields.add(event.target.id);
  setFieldValidationError(event.target.id, getLoginFieldError(event.target.id));
}


/** Refreshes touched feedback and clears stale submit or Firebase messages. */
function handleLoginInput() {
  renderTouchedFieldErrors(touchedLoginFields, getLoginFieldError);
  showLoginError("");
}


/** @returns {string} Validation feedback for one login field. */
function getLoginFieldError(fieldId) {
  if (fieldId === "loginEmail") {
    return getLoginEmailError(getTrimmedInputValue(fieldId));
  }
  if (fieldId === "loginPassword") {
    return getLoginPasswordError(getTrimmedInputValue(fieldId));
  }
  return "";
}


/** @returns {string} Validation feedback for the login email. */
function getLoginEmailError(email) {
  if (!email) return "Please enter your email address.";
  return isEmailAddressValid(email) ? "" : "Please enter a valid email address.";
}


/** @returns {string} Validation feedback for the login password. */
function getLoginPasswordError(password) {
  return password ? "" : "Please enter your password.";
}


/**
 * Shows a message in the login error area. An empty string clears it.
 * @param {string} message - The message to display.
 */
function showLoginError(message) {
  const errorElement = getElement("loginError");
  errorElement.textContent = message;
}
