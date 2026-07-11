function initLegalNoticeLanguageSwitch() {
  syncInternalLegalCopy();

  const legalPages = document.querySelectorAll(".legal-page--legal");
  const toggles = document.querySelectorAll(".language-switch__input");

  updateLegalViewMode();

  if (!legalPages.length || !toggles.length) return;

  toggles.forEach((toggle) => {
    toggle.addEventListener("change", () => updateLegalLanguage(legalPages, toggle));
  });
  updateLegalLanguage(legalPages, toggles[0]);
}

function updateLegalLanguage(pages, activeToggle) {
  document.querySelectorAll(".language-switch__input").forEach((toggle) => {
    toggle.checked = activeToggle.checked;
  });
  pages.forEach((page) => page.classList.toggle("legal-page--english", activeToggle.checked));
}

function syncInternalLegalCopy() {
  const internalCopy = document.getElementById("legalInternalCopy");
  const externalCopies = document.querySelectorAll("#legalExternalView .privacy-copy");

  if (!internalCopy || !externalCopies.length || internalCopy.children.length) return;

  // Keep the legal copy single-sourced so the public and app-shell views cannot drift apart.
  externalCopies.forEach((copy) => internalCopy.append(copy.cloneNode(true)));
}

function updateLegalViewMode() {
  const isInternalView = Boolean(getStoredUser());
  const externalView = document.getElementById("legalExternalView");
  const internalView = document.getElementById("legalInternalView");

  if (!externalView || !internalView) return;
  externalView.hidden = isInternalView;
  internalView.hidden = !isInternalView;
}
