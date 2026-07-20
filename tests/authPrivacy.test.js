const assert = require("node:assert/strict");
const test = require("node:test");

const { loadBrowserScripts } = require("./helpers/scriptContext");

const authScript = "components/js/auth.js";
const sharedScript = "components/js/shared.js";
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
  const openedPages = [];
  const window = { open: (...args) => openedPages.push(args) };
  const document = createAuthDocument(elements);
  const context = loadBrowserScripts([sharedScript, authScript, signupScript], {
    document, window,
  });
  return { context, elements, openedPages };
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


test("keeps privacy consent locked while a required field is invalid", () => {
  const { context, elements } = createAuthContext();
  elements.signupEmail.value = "invalid-email";
  context.syncPrivacyConsent();
  assert.equal(elements.privacyAccepted.disabled, true);
  assert.equal(elements.signupButton.disabled, true);
  assert.match(elements.privacyConsentHint.textContent, /Complete all required fields/);
});


test("opens Privacy separately and preserves signup values in memory", () => {
  const { context, elements, openedPages } = createAuthContext();
  const event = createPrivacyOpenEvent();
  const valuesBefore = getSignupValues(elements);
  context.handlePrivacyPolicyOpen(event);
  assert.equal(event.prevented, true);
  assert.deepEqual(openedPages, [[event.currentTarget.href, "_blank", "noopener,noreferrer"]]);
  assert.deepEqual(getSignupValues(elements), valuesBefore);
});


test("enables privacy consent when every required field is valid", () => {
  const { context, elements } = createAuthContext();
  context.syncPrivacyConsent();
  assert.equal(elements.privacyAccepted.disabled, false);
  assert.equal(elements.signupButton.disabled, true);
  assert.match(elements.privacyConsentHint.textContent, /You can now accept/);
});


test("enables signup after valid fields and accepted privacy consent", () => {
  const { context, elements } = createAuthContext();
  context.syncPrivacyConsent();
  elements.privacyAccepted.checked = true;
  context.updateSignupButton();
  assert.equal(context.isSignupFormValid(), true);
  assert.equal(elements.signupButton.disabled, false);
});


test("locks and clears consent when a required field becomes invalid", () => {
  const { context, elements } = createAuthContext();
  elements.privacyAccepted.checked = true;
  elements.signupName.value = "";
  context.syncPrivacyConsent();
  assert.equal(elements.privacyAccepted.disabled, true);
  assert.equal(elements.privacyAccepted.checked, false);
  assert.equal(elements.signupButton.disabled, true);
});


test("shows a clear error when privacy consent was not accepted", async () => {
  const { context, elements } = createAuthContext();
  const event = createPrivacyOpenEvent();
  await context.handleSignup(event);
  assert.equal(elements.signupMessage.textContent, "Please accept the Privacy Policy.");
});
