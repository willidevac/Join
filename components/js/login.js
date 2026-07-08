/**
 * Wires up the login form and the guest login button.
 * Runs every time the login page fragment is rendered.
 */
function initLoginValidation() {
  const loginForm = document.getElementById("loginForm");
  const guestLoginButton = document.getElementById("guestLoginButton");

  if (!loginForm || !guestLoginButton) {
    return;
  }

  loginForm.addEventListener("submit", handleLoginSubmit);
  guestLoginButton.addEventListener("click", handleGuestLogin);
}


/**
 * Handles the login form submit: validates the input and starts the login.
 * @param {SubmitEvent} event - The form submit event.
 */
async function handleLoginSubmit(event) {
  event.preventDefault();

  const email = getLoginEmail();
  const password = getLoginPassword();

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
  const submitButton = getLoginSubmitButton();
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
  if (email === "" || password === "") {
    showLoginError("Please fill in email and password.");
    return false;
  }

  if (!isValidEmail(email)) {
    showLoginError("Please enter a valid email address.");
    return false;
  }

  return true;
}


/**
 * Reads the email input value without surrounding whitespace.
 * @returns {string} The trimmed email address.
 */
function getLoginEmail() {
  return document.getElementById("loginEmail").value.trim();
}


/**
 * Reads the password input value. Not trimmed, because whitespace
 * is a valid password character and signup does not trim either.
 * @returns {string} The password as typed by the user.
 */
function getLoginPassword() {
  return document.getElementById("loginPassword").value;
}


/**
 * Shows a message in the login error area. An empty string clears it.
 * @param {string} message - The message to display.
 */
function showLoginError(message) {
  const errorElement = document.getElementById("loginError");
  errorElement.textContent = message;
}


/**
 * Checks whether a string looks like a valid email address.
 * @param {string} email - The email address to check.
 * @returns {boolean} True if the format is valid.
 */
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}


/**
 * Returns the submit button of the login form.
 * @returns {HTMLButtonElement} The login submit button.
 */
function getLoginSubmitButton() {
  return document.getElementById("loginSubmitButton");
}