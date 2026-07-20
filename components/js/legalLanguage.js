const legalLanguageStorageKey = "joinLegalLanguage";


/**
 * Returns the saved legal-page language or English as the default.
 * @returns {string} Supported language code.
 */
function getStoredLegalLanguage() {
  const language = localStorage.getItem(legalLanguageStorageKey);
  return language === "de" ? "de" : "en";
}


/**
 * Connects all language toggles and restores the saved preference.
 * @param {NodeList|Array} pages - Legal page containers to translate.
 * @param {NodeList|Array} toggles - Language switches on the current page.
 */
function initLegalLanguageControls(pages, toggles) {
  toggles.forEach((toggle) => bindLegalLanguageToggle(pages, toggles, toggle));
  applyLegalLanguage(pages, toggles, getStoredLegalLanguage());
}


/**
 * Connects one switch to the shared legal-page language state.
 */
function bindLegalLanguageToggle(pages, toggles, toggle) {
  toggle.addEventListener("change", () => {
    updateStoredLegalLanguage(pages, toggles, toggle.checked);
  });
}


/**
 * Persists a switch change and applies it to every legal-page control.
 */
function updateStoredLegalLanguage(pages, toggles, showEnglish) {
  const language = showEnglish ? "en" : "de";
  localStorage.setItem(legalLanguageStorageKey, language);
  applyLegalLanguage(pages, toggles, language);
}


/**
 * Synchronizes page copy, controls and document language metadata.
 */
function applyLegalLanguage(pages, toggles, language) {
  const showEnglish = language === "en";
  syncLegalLanguageToggles(toggles, showEnglish);
  syncLegalLanguagePages(pages, showEnglish);
  document.documentElement.lang = language;
}


/**
 * Mirrors the active language to every visible or hidden switch.
 */
function syncLegalLanguageToggles(toggles, showEnglish) {
  toggles.forEach((toggle) => { toggle.checked = showEnglish; });
}


/**
 * Shows the matching language copy in all page variants.
 */
function syncLegalLanguagePages(pages, showEnglish) {
  pages.forEach((page) => {
    page.classList.toggle("legal-page--english", showEnglish);
  });
}
