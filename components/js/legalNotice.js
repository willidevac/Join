/**
 * Initializes the legal notice page with view mode and language toggles.
 */
function initLegalNoticeLanguageSwitch() {
  syncInternalLegalCopy();
  const legalPages = document.querySelectorAll(".legal-page--legal");
  const toggles = document.querySelectorAll(".language-switch__input");
  updateLegalViewMode();
  if (!legalPages.length || !toggles.length) return;
  initLegalLanguageControls(legalPages, toggles);
}


/**
 * Clones the public legal copy into the app-shell view once.
 */
function syncInternalLegalCopy() {
  const internalCopy = document.getElementById("legalInternalCopy");
  const externalCopies = document.querySelectorAll(
    "#legalExternalView .privacy-copy",
  );
  if (!internalCopy || !externalCopies.length || internalCopy.children.length)
    return;
  externalCopies.forEach((copy) => internalCopy.append(copy.cloneNode(true)));
}


/**
 * Shows the public or the app-shell view depending on the login state.
 */
function updateLegalViewMode() {
  const isInternalView = Boolean(getStoredUser());
  const externalView = document.getElementById("legalExternalView");
  const internalView = document.getElementById("legalInternalView");

  if (!externalView || !internalView) return;
  externalView.hidden = isInternalView;
  internalView.hidden = !isInternalView;
}
