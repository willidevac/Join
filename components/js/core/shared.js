let lockedScrollY = 0;


const emailAddressPattern = /^[a-zA-Z0-9._%+-]+@(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
const phoneNumberPattern = /^\+?[\d\s()-]+$/;
const personNamePattern = /^\p{L}[\p{L}\p{M}]*(?:[- '\u2019]\p{L}[\p{L}\p{M}]*)*$/u;
const minimumPersonNameLength = 2;
const minimumPhoneDigits = 6;


/**
 * Checks an email address with the format shared by account and contact forms.
 * @param {string} email - The email address to validate.
 * @returns {boolean} True when the complete address format is valid.
 */
function isEmailAddressValid(email) {
  const normalizedEmail = normalizeText(email);
  const localPart = normalizedEmail.split("@")[0];
  return emailAddressPattern.test(normalizedEmail) &&
    !localPart.startsWith(".") &&
    !localPart.endsWith(".") &&
    !localPart.includes("..");
}


/**
 * Reads an input value by id and removes accidental surrounding whitespace.
 * @param {string} inputId - Id of the input element to read.
 * @returns {string} The normalized input value.
 */
function getTrimmedInputValue(inputId) {
  return getTrimmedElementValue(getElement(inputId));
}


/** Converts a value into text without surrounding whitespace. */
function normalizeText(value) {
  return String(value ?? "").trim();
}


/**
 * Checks a person's name with international letters and common separators.
 * @param {string} name - Display name to validate.
 * @returns {boolean} True when the complete name format is valid.
 */
function isPersonNameValid(name) {
  const normalizedName = normalizeText(name);
  return normalizedName.length >= minimumPersonNameLength &&
    personNamePattern.test(normalizedName);
}


/** @returns {string} Shared validation feedback for a person's name. */
function getPersonNameError(name) {
  const normalizedName = normalizeText(name);
  if (!normalizedName) return "Please enter a name.";
  if (normalizedName.length < minimumPersonNameLength) return "Enter at least 2 characters.";
  return isPersonNameValid(normalizedName) ? "" : "Use letters, spaces, hyphens, or apostrophes only.";
}


/** Reads and trims the value of one form control. */
function getTrimmedElementValue(element) {
  return normalizeText(element?.value);
}


/**
 * Returns one DOM element for a caller-supplied id.
 * @param {string} elementId - Id of the required element.
 * @returns {HTMLElement|null} The matching element.
 */
function getElement(elementId) {
  return document.getElementById(elementId);
}


/**
 * Reads JSON data from localStorage and returns a fallback when no value exists.
 */
function getStoredJson(storageKey, fallback = null) {
  const storedValue = localStorage.getItem(storageKey);
  return storedValue ? JSON.parse(storedValue) : fallback;
}


/** Persists one serializable value in localStorage. */
function saveStoredJson(storageKey, value) {
  localStorage.setItem(storageKey, JSON.stringify(value));
}


/** Returns up to two uppercase initials from a display name. */
function getInitials(name) {
  return normalizeText(name)
    .split(/\s+/)
    .filter(Boolean)
    .map((namePart) => namePart.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();
}


/** Updates an element's text when the target exists. */
function setElementText(elementId, text) {
  const element = getElement(elementId);
  if (element) element.textContent = text;
}


/** Applies one field error message and its accessibility state. */
function setFieldValidationError(fieldId, message) {
  getElement(fieldId)?.setAttribute("aria-invalid", String(Boolean(message)));
  setElementText(`${fieldId}Error`, message);
}


/** Marks a group of field ids as touched. */
function touchFields(fieldIds, touchedFields) {
  fieldIds.forEach((fieldId) => touchedFields.add(fieldId));
}


/** Renders every touched field through a caller-provided validator. */
function renderTouchedFieldErrors(touchedFields, getError) {
  touchedFields.forEach((fieldId) => {
    setFieldValidationError(fieldId, getError(fieldId));
  });
}


/** Shows feedback temporarily and optionally replaces its text. */
function showTimedFeedback(target, message = null, duration = 3000) {
  const element = typeof target === "string" ? getElement(target) : target;
  if (!element) return;
  if (message !== null) element.textContent = message;
  element.hidden = false;
  setTimeout(() => (element.hidden = true), duration);
}


/**
 * Removes characters that cannot be part of a phone number.
 * @param {string} value - Raw phone input.
 * @returns {string} Input containing only digits and common phone symbols.
 */
function sanitizePhoneNumber(value) {
  const allowedCharacters = String(value || "").replace(/[^\d+()\s-]/g, "");
  return allowedCharacters.replace(/(?!^)\+/g, "");
}


/**
 * Checks the allowed phone characters and requires a realistic digit count.
 * @param {string} value - Phone number to validate.
 * @returns {boolean} True for a valid phone number.
 */
function isPhoneNumberValid(value) {
  const normalizedPhone = normalizeText(value);
  const digitCount = normalizedPhone.replace(/\D/g, "").length;
  return phoneNumberPattern.test(normalizedPhone) && digitCount >= minimumPhoneDigits;
}


/**
 * @returns {Object|null} The signed-in user from localStorage, or null.
 */
function getStoredUser() {
  return getStoredJson("joinUser");
}


/**
 * Persists the signed-in user for other pages of the application.
 *
 * @param {Object} user - User object to store in localStorage.
 */
function saveStoredUser(user) {
  saveStoredJson("joinUser", user);
}


/**
 * Removes the stored user on logout.
 */
function clearStoredUser() {
  localStorage.removeItem("joinUser");
}


/**
 * Escapes a value for safe interpolation into HTML templates.
 *
 * @param {*} value - Any value; it is converted to a string first.
 * @returns {string} Text with HTML special characters encoded.
 */
function escapeHtmlText(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


/**
 * Creates the stable task reference stored for an assigned contact.
 * @param {Object} contact - Contact with an id and display name.
 * @returns {{id: string, name: string}} Serializable assignee reference.
 */
function createTaskAssigneeReference(contact) {
  return {
    id: normalizeText(contact?.id),
    name: normalizeText(contact?.name),
  };
}


/**
 * Converts a current object or legacy name string into one reference shape.
 * @param {Object|string} assignee - Stored assignee value.
 * @returns {{id: string, name: string}} Normalized assignee reference.
 */
function normalizeTaskAssigneeReference(assignee) {
  if (typeof assignee === "string") {
    return { id: "", name: normalizeText(assignee) };
  }
  return createTaskAssigneeReference(assignee || {});
}


/**
 * Normalizes arrays and legacy comma-separated assignee names.
 * @param {Array|string} assignedTo - Stored task assignment value.
 * @returns {Object[]} Clean assignee references.
 */
function getTaskAssigneeReferences(assignedTo) {
  const values = Array.isArray(assignedTo)
    ? assignedTo
    : String(assignedTo || "").split(",");
  return values.map(normalizeTaskAssigneeReference).filter((item) => item.name);
}


/**
 * Checks whether an assignee reference belongs to a contact.
 * @param {Object|string} assignee - Stored assignee value.
 * @param {Object} contact - Contact to compare.
 * @returns {boolean} True for a matching id or legacy name.
 */
function isTaskAssigneeContact(assignee, contact) {
  const reference = normalizeTaskAssigneeReference(assignee);
  if (reference.id && contact.id) return reference.id === String(contact.id);
  return reference.name === contact.name;
}


/**
 * Splits assignees into a visible slice and an overflow count for chip rows.
 * @param {Object[]} assignees - All currently selected assignees.
 * @param {number} maxVisible - Maximum number of avatars to show directly.
 * @returns {{visible: Object[], overflowCount: number}} Chip row data.
 */
function getVisibleAssigneeChips(assignees, maxVisible) {
  return {
    visible: assignees.slice(0, maxVisible),
    overflowCount: Math.max(0, assignees.length - maxVisible),
  };
}


/**
 * Locks page scrolling while a dialog is open and stores the scroll position.
 */
function lockPageScroll() {
  lockedScrollY = window.scrollY;
  document.body.style.top = `-${lockedScrollY}px`;
  document.body.classList.add("no-scroll");
}


/**
 * Restores page scrolling at the previously stored scroll position.
 */
function unlockPageScroll() {
  document.body.classList.remove("no-scroll");
  document.body.style.top = "";
  window.scrollTo({ top: lockedScrollY, behavior: "instant" });
}
