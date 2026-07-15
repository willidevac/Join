/**
 * @returns {Object|null} The signed-in user from localStorage, or null.
 */
function getStoredUser() {
  return JSON.parse(localStorage.getItem('joinUser'));
}


/**
 * Persists the signed-in user for other pages of the application.
 *
 * @param {Object} user - User object to store in localStorage.
 */
function saveStoredUser(user) {
  localStorage.setItem('joinUser', JSON.stringify(user));
}


/**
 * Removes the stored user on logout.
 */
function clearStoredUser() {
  localStorage.removeItem('joinUser');
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
    id: String(contact?.id || ""),
    name: String(contact?.name || "").trim(),
  };
}


/**
 * Converts a current object or legacy name string into one reference shape.
 * @param {Object|string} assignee - Stored assignee value.
 * @returns {{id: string, name: string}} Normalized assignee reference.
 */
function normalizeTaskAssigneeReference(assignee) {
  if (typeof assignee === "string") {
    return { id: "", name: assignee.trim() };
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
