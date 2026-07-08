// Dummy auth for the first project structure step.
// This only uses localStorage and must be replaced with real Firebase/Auth later.

document.addEventListener('DOMContentLoaded', initSignupValidation);


function handleLogin(event) {
  event.preventDefault();
  saveStoredUser({ name: 'User', type: 'login' });
  window.location.href = './summary.html';
}


function handleSignup(event) {
  event.preventDefault();
  if (!isSignupFormValid()) {
    showSignupMessage(getSignupErrorMessage());
    return;
  }
  saveStoredUser({ name: getSignupName(), type: 'signup' });
  window.location.href = './summary.html';
}


function handleGuestLogin() {
  saveStoredUser({ name: 'Guest', type: 'guest' });
  window.location.href = './summary.html';
}


function handleLogout() {
  clearStoredUser();
  window.location.href = './index.html';
}


function protectPage() {
  if (!getStoredUser()) {
    window.location.href = './index.html';
  }
}


function initSignupValidation() {
  const form = document.getElementById('signupForm');
  if (!form) return;
  form.addEventListener('input', updateSignupButton);
  getPrivacyLink().addEventListener('click', rememberPrivacyOpened);
  getPrivacyCheckbox().addEventListener('change', updateSignupButton);
  syncPrivacyConsent();
}


function rememberPrivacyOpened() {
  sessionStorage.setItem('joinPrivacyOpened', 'true');
}


function syncPrivacyConsent() {
  getPrivacyCheckbox().disabled = !hasOpenedPrivacyPolicy();
  updateSignupButton();
}


function updateSignupButton() {
  getSignupButton().disabled = !isSignupFormValid();
  if (isSignupFormValid()) showSignupMessage('');
}


function isSignupFormValid() {
  return Boolean(
    getSignupName() &&
    isEmailValid() &&
    getSignupPassword() &&
    passwordsMatch() &&
    hasOpenedPrivacyPolicy() &&
    getPrivacyCheckbox().checked
  );
}


function getSignupErrorMessage() {
  if (!getSignupName()) return 'Please enter your name.';
  if (!isEmailValid()) return 'Please enter a valid email address.';
  if (!getSignupPassword()) return 'Please enter a password.';
  if (!passwordsMatch()) return 'Your passwords do not match.';
  if (!hasOpenedPrivacyPolicy()) return 'Please open the Privacy Policy first.';
  if (!getPrivacyCheckbox().checked) return 'Please accept the Privacy Policy.';
  return '';
}


function isEmailValid() {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(getSignupEmail());
}


function passwordsMatch() {
  return getSignupPassword() === getSignupConfirmPassword();
}


function hasOpenedPrivacyPolicy() {
  return sessionStorage.getItem('joinPrivacyOpened') === 'true';
}


function getSignupName() {
  return document.getElementById('signupName').value.trim();
}


function getSignupEmail() {
  return document.getElementById('signupEmail').value.trim();
}


function getSignupPassword() {
  return document.getElementById('signupPassword').value;
}


function getSignupConfirmPassword() {
  return document.getElementById('signupConfirmPassword').value;
}


function getPrivacyCheckbox() {
  return document.getElementById('privacyAccepted');
}


function getPrivacyLink() {
  return document.getElementById('privacyPolicyLink');
}


function getSignupButton() {
  return document.getElementById('signupButton');
}


function showSignupMessage(message) {
  document.getElementById('signupMessage').textContent = message;
}
