function handleLogin(event) {
  event.preventDefault();
  saveStoredUser({ name: 'User', type: 'login' });
  navigateToPage('summary');
}


function handleSignup(event) {
  event.preventDefault();
  if (!isSignupFormValid()) {
    showSignupMessage(getSignupErrorMessage());
    return;
  }
  saveStoredUser({ name: getSignupName(), type: 'signup' });
  navigateToPage('summary');
}


function handleGuestLogin() {
  saveStoredUser({ name: 'Guest', type: 'guest' });
  navigateToPage('summary');
}


function handleLogout() {
  // Dummy logout: clears the temporary localStorage user until Firebase/Auth is added.
  clearStoredUser();
  navigateToPage('login');
}




function initSignupValidation() {
  const form = document.getElementById('signupForm');
  if (!form) return;
  rememberPrivacyReturn();
  form.addEventListener('input', updateSignupButton);
  getPrivacyLink().addEventListener('click', rememberPrivacyOpened);
  getPrivacyCheckbox().addEventListener('change', updateSignupButton);
  syncPrivacyConsent();
}


function rememberPrivacyOpened() {
  sessionStorage.setItem('joinPrivacyOpened', 'true');
}


function rememberPrivacyReturn() {
  const params = new URLSearchParams(window.location.search);

  if (params.get('privacy') !== 'opened') {
    return;
  }

  rememberPrivacyOpened();
  params.delete('privacy');
  window.history.replaceState({}, '', `?${params.toString()}`);
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
