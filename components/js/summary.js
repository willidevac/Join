/**
 * Shows the currently signed-in user on the protected summary page.
 */
function initSummaryUser() {
  const user = getStoredUser();
  if (!user) return;

  setSummaryText("summaryGreeting", getSummaryDisplayName(user));
  setSummaryText("summaryUserType", getSummaryUserTypeText(user));
  setSummaryText("summaryUserInitials", getSummaryInitials(user));
}

/**
 * Returns the display name for the summary greeting.
 */
function getSummaryDisplayName(user) {
  return user.name || "Guest";
}

/**
 * Builds short initials for the user button in the header.
 */
function getSummaryInitials(user) {
  return getSummaryDisplayName(user)
    .split(" ")
    .map((namePart) => namePart.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();
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
