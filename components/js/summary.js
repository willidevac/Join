/**
 * Shows the currently signed-in user on the protected summary page.
 */
function initSummaryUser() {
  const user = getStoredUser();
  if (!user) return;

  setSummaryText("summaryGreeting", getSummaryGreeting(user));
  setSummaryText("summaryUserType", getSummaryUserTypeText(user));
}

/**
 * Builds the greeting text from the stored Firebase or guest user.
 */
function getSummaryGreeting(user) {
  return `Welcome back, ${user.name}.`;
}

/**
 * Explains whether the current session belongs to a guest or regular user.
 */
function getSummaryUserTypeText(user) {
  if (user.type === "firebase-guest" || user.type === "guest") {
    return "You are signed in as a guest.";
  }

  return "You are signed in with your account.";
}

/**
 * Updates a summary text element only when it exists on the page.
 */
function setSummaryText(elementId, text) {
  const element = document.getElementById(elementId);
  if (element) element.textContent = text;
}