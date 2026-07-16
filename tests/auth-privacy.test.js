const assert = require("node:assert/strict");
const test = require("node:test");

const {
  createMemoryStorage,
  loadBrowserScripts,
} = require("./helpers/scriptContext");

const authScript = "components/js/auth.js";
const signupScript = "components/js/signup.js";

/**
 * Creates the signup controls used by the auth validation helpers.
 * @returns {Object} Minimal form element map for the isolated script context.
 */
function createSignupElements() {
  return {
    signupName: { value: "QA User" },
    signupEmail: { value: "qa.user@example.com" },
    signupPassword: { value: "Testpass123!" },
    signupConfirmPassword: { value: "Testpass123!" },
    privacyAccepted: { checked: false, disabled: false },
    privacyConsentHint: { textContent: "" },
    signupButton: { disabled: false },
    signupMessage: { textContent: "" },
  };
}


/**
 * Builds the document methods used by the signup validation code.
 * @param {Object} elements - Form elements keyed by id.
 * @returns {Object} Minimal document implementation.
 */
function createAuthDocument(elements) {
  return {
    getElementById: (id) => elements[id],
    querySelectorAll: () => [],
  };
}


/**
 * Loads the shared auth and page-specific signup scripts.
 * @returns {Object} Auth test context and observable dependencies.
 */
function createAuthContext() {
  const elements = createSignupElements();
  const sessionStorage = createMemoryStorage();
  const openedPages = [];
  const window = { open: (...args) => openedPages.push(args) };
  const document = createAuthDocument(elements);
  const context = loadBrowserScripts([authScript, signupScript], {
    document, sessionStorage, window,
  });
  return { context, elements, openedPages, sessionStorage };
}


/**
 * Creates the click event passed to the Privacy Policy handler.
 * @returns {Object} Event with an observable preventDefault call.
 */
function createPrivacyOpenEvent() {
  return {
    currentTarget: { href: "http://localhost/privacyPolicy.html" },
    prevented: false,
    preventDefault() { this.prevented = true; },
  };
}


/**
 * Returns the values that must remain in memory while Privacy opens.
 * @param {Object} elements - Form elements keyed by id.
 * @returns {string[]} Current signup field values.
 */
function getSignupValues(elements) {
  return [
    elements.signupName.value,
    elements.signupEmail.value,
    elements.signupPassword.value,
    elements.signupConfirmPassword.value,
  ];
}


test("keeps privacy consent locked before the policy was opened", () => {
  const { context, elements } = createAuthContext();
  context.syncPrivacyConsent();
  assert.equal(elements.privacyAccepted.disabled, true);
  assert.equal(elements.signupButton.disabled, true);
  assert.match(elements.privacyConsentHint.textContent, /Open the Privacy Policy/);
});


test("opens Privacy separately and preserves signup values in memory", () => {
  const { context, elements, openedPages, sessionStorage } = createAuthContext();
  const event = createPrivacyOpenEvent();
  const valuesBefore = getSignupValues(elements);
  context.handlePrivacyPolicyOpen(event);
  assert.equal(event.prevented, true);
  assert.deepEqual(openedPages, [[event.currentTarget.href, "_blank", "noopener,noreferrer"]]);
  assert.deepEqual(getSignupValues(elements), valuesBefore);
  assert.equal(sessionStorage.getItem("joinPrivacyOpened"), "true");
  assert.equal(elements.privacyAccepted.disabled, false);
});


test("does not unlock signup through a direct Privacy page visit", () => {
  const { context, elements } = createAuthContext();
  elements.privacyAccepted.checked = true;
  assert.equal(context.hasOpenedPrivacyPolicy(), false);
  assert.equal(context.isSignupFormValid(), false);
});


test("enables signup only after Privacy was opened and accepted", () => {
  const { context, elements, sessionStorage } = createAuthContext();
  sessionStorage.setItem("joinPrivacyOpened", "true");
  elements.privacyAccepted.checked = true;
  context.updateSignupButton();
  assert.equal(context.isSignupFormValid(), true);
  assert.equal(elements.signupButton.disabled, false);
});


test("shows a clear error when consent was not unlocked", async () => {
  const { context, elements } = createAuthContext();
  const event = createPrivacyOpenEvent();
  elements.privacyAccepted.checked = true;
  await context.handleSignup(event);
  assert.equal(elements.signupMessage.textContent, "Please open the Privacy Policy first.");
});
