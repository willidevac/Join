const CONTACT_STORAGE_KEY = "joinContacts";
const ACCOUNT_CONTACT_PREFIX = "account-";
const GUEST_USER_TYPES = ["firebase-guest", "guest"];
const CONTACT_COLORS = [
  "#FF7A00", "#9327FF", "#6E52FF", "#FC71FF", "#FFBB2B",
  "#1FD7C1", "#FF4646", "#00BEE8", "#FF745E", "#0038FF",
];


/**
 * Reads contacts from Firestore when available, otherwise from localStorage.
 * @param {Function} [onAccountContactError] - Handles account contact errors.
 * @returns {Promise<Array>} The contacts available for rendering.
 */
async function loadContactsFromStore(onAccountContactError) {
  const contacts = isContactFirestoreReady()
    ? await window.joinFirebaseContacts.loadContacts()
    : getLocalContacts();
  return ensureAccountContactSafely(contacts, onAccountContactError);
}


/**
 * Keeps loaded contacts available if the account contact cannot be saved.
 * @param {Array} contacts - The contacts already loaded from the store.
 * @param {Function} [onError] - Handles the isolated save error.
 * @returns {Promise<Array>} The contacts available for rendering.
 */
async function ensureAccountContactSafely(contacts, onError) {
  try {
    return await ensureAccountContact(contacts);
  } catch (error) {
    if (onError) onError(error);
    return contacts;
  }
}


/**
 * Adds the signed-in account once and reuses a contact with the same email.
 */
async function ensureAccountContact(contacts) {
  const user = getStoredUser();
  if (!canCreateAccountContact(user)) return contacts;
  const state = getAccountContactState(contacts, user);
  if (state.accountContact && !state.emailDuplicates.length) return contacts;
  return saveAccountContactState(contacts, user, state);
}


function getAccountContactState(contacts, user) {
  const accountId = getAccountContactId(user.uid);
  return {
    accountId,
    accountContact: findContactById(contacts, accountId),
    emailDuplicates: findAccountEmailDuplicates(contacts, user.email, accountId),
  };
}

async function saveAccountContactState(contacts, user, state) {
  const account = getAccountContactData(
    user,
    state.accountContact || state.emailDuplicates[0],
  );
  const duplicateIds = state.emailDuplicates.map((contact) => contact.id);
  const savedAccount = await upsertAccountContactInStore(
    state.accountId,
    duplicateIds,
    account,
  );
  return replaceAccountContact(contacts, duplicateIds, savedAccount);
}


function canCreateAccountContact(user) {
  return Boolean(
    user?.uid &&
    user?.email &&
    !GUEST_USER_TYPES.includes(user.type),
  );
}


function getAccountContactId(uid) {
  return ACCOUNT_CONTACT_PREFIX + uid;
}


function findContactById(contacts, contactId) {
  return contacts.find((contact) => contact.id === contactId);
}


function findAccountEmailDuplicates(contacts, email, accountId) {
  const normalizedEmail = normalizeContactEmail(email);
  return contacts.filter(
    (contact) =>
      contact.id !== accountId &&
      normalizeContactEmail(contact.email) === normalizedEmail,
  );
}


function normalizeContactEmail(email) {
  return String(email || "").trim().toLowerCase();
}


function getAccountContactData(user, existingContact) {
  return {
    name: existingContact?.name || user.name,
    email: existingContact?.email || user.email,
    phone: existingContact?.phone || "",
    color: existingContact?.color || getAccountContactColor(user.uid),
  };
}


function getAccountContactColor(uid) {
  const colorIndex = [...uid].reduce(
    (total, character) => total + character.charCodeAt(0),
    0,
  );
  return CONTACT_COLORS[colorIndex % CONTACT_COLORS.length];
}


async function upsertAccountContactInStore(accountId, duplicateIds, contact) {
  if (isContactFirestoreReady()) {
    return window.joinFirebaseContacts.upsertAccountContact(
      accountId,
      duplicateIds,
      contact,
    );
  }
  return upsertLocalAccountContact(accountId, duplicateIds, contact);
}


function upsertLocalAccountContact(accountId, duplicateIds, contact) {
  const accountContact = { id: accountId, ...contact };
  const replacedIds = new Set([accountId, ...duplicateIds]);
  const contacts = getLocalContacts().filter(
    (currentContact) => !replacedIds.has(currentContact.id),
  );
  saveLocalContacts([...contacts, accountContact]);
  return accountContact;
}


function replaceAccountContact(contacts, duplicateIds, accountContact) {
  const replacedIds = new Set([accountContact.id, ...duplicateIds]);
  const otherContacts = contacts.filter(
    (contact) => !replacedIds.has(contact.id),
  );
  return [...otherContacts, accountContact];
}


function isOwnAccountContact(contact) {
  const user = getStoredUser();
  if (!canCreateAccountContact(user) || !contact) return false;
  return contact.id === getAccountContactId(user.uid) ||
    normalizeContactEmail(contact.email) === normalizeContactEmail(user.email);
}


/**
 * Creates one contact in Firestore or localStorage and returns it with an id.
 */
async function createContactInStore(contact) {
  if (isContactFirestoreReady())
    return window.joinFirebaseContacts.createContact(contact);
  const newContact = { id: Date.now().toString(), ...contact };
  saveLocalContacts([...getLocalContacts(), newContact]);
  return newContact;
}


/**
 * Updates one contact in Firestore or localStorage.
 */
async function updateContactInStore(contactId, contact) {
  if (isContactFirestoreReady()) {
    await window.joinFirebaseContacts.updateContact(contactId, contact);
    return;
  }
  const contacts = getLocalContacts().map((item) =>
    item.id === contactId ? { ...item, ...contact } : item,
  );
  saveLocalContacts(contacts);
}


/**
 * Deletes one contact from Firestore or localStorage.
 */
async function deleteContactFromStore(contactId) {
  if (isContactFirestoreReady()) {
    await window.joinFirebaseContacts.deleteContact(contactId);
    return;
  }
  saveLocalContacts(
    getLocalContacts().filter((contact) => contact.id !== contactId),
  );
}


/**
 * Checks whether the Firestore contact API is loaded and available.
 */
function isContactFirestoreReady() {
  return Boolean(window.joinFirebaseContacts);
}


/**
 * Reads and parses the stored contacts from localStorage.
 */
function getLocalContacts() {
  const storedContact = localStorage.getItem(CONTACT_STORAGE_KEY);
  return storedContact ? JSON.parse(storedContact) : [];
}


/**
 * Writes the given contact list as JSON into localStorage.
 */
function saveLocalContacts(contacts) {
  localStorage.setItem(CONTACT_STORAGE_KEY, JSON.stringify(contacts));
}
