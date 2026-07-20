/**
 * Initializes the privacy policy page with view mode and language toggles.
 */
function initPrivacyLanguageSwitch() {
  syncInternalPrivacyCopy();
  const privacyPages = document.querySelectorAll(".legal-page--privacy");
  const toggles = document.querySelectorAll(".language-switch__input");
  updatePrivacyViewMode();
  if (!privacyPages.length || !toggles.length) return;
  initLegalLanguageControls(privacyPages, toggles);
}


/**
 * Clones the public privacy copy into the app-shell view once.
 */
function syncInternalPrivacyCopy() {
  const internalCopy = document.getElementById("privacyInternalCopy");
  const externalCopies = document.querySelectorAll(
    "#privacyExternalView .privacy-copy",
  );
  if (!internalCopy || !externalCopies.length || internalCopy.children.length)
    return;
  externalCopies.forEach((copy) => internalCopy.append(copy.cloneNode(true)));
}


/**
 * Shows the public or the app-shell view depending on the login state.
 */
function updatePrivacyViewMode() {
  const isInternalView = Boolean(getStoredUser());
  const externalView = document.getElementById("privacyExternalView");
  const internalView = document.getElementById("privacyInternalView");
  if (!externalView || !internalView) return;
  externalView.hidden = isInternalView;
  internalView.hidden = !isInternalView;
}
